import argparse
import json
import random
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse
from urllib.robotparser import RobotFileParser

import pandas as pd
import requests
import yaml
from bs4 import BeautifulSoup


@dataclass
class RuntimeConfig:
    user_agent: str
    request_timeout_seconds: int
    max_retries: int
    strict_robots: bool


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return data


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def to_int(raw: Any) -> Any:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return int(raw)
    text = str(raw)
    match = re.search(r"-?\d+", text.replace(",", ""))
    return int(match.group(0)) if match else None


def to_float(raw: Any) -> Any:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    text = str(raw).replace(",", "")
    match = re.search(r"-?\d+(\.\d+)?", text)
    return float(match.group(0)) if match else None


def to_money(raw: Any) -> Any:
    if raw is None:
        return None
    text = str(raw).upper().replace(",", "")
    text = text.replace("KES", "").replace("KSH", "").replace("KSHS", "").strip()
    multiplier = 1
    if text.endswith("M"):
        multiplier = 1_000_000
        text = text[:-1]
    elif text.endswith("B"):
        multiplier = 1_000_000_000
        text = text[:-1]
    value = to_float(text)
    return int(value * multiplier) if value is not None else None


def split_region_parts(raw: Any) -> list[str]:
    if raw is None:
        return []
    text = normalize_space(str(raw))
    parts = [normalize_space(part) for part in text.split(",") if normalize_space(part)]
    return parts


def to_region_county(raw: Any) -> Any:
    parts = split_region_parts(raw)
    return parts[0] if parts else None


def to_region_sub_county(raw: Any) -> Any:
    parts = split_region_parts(raw)
    return parts[1] if len(parts) > 1 else None


TRANSFORMS: dict[str, Any] = {
    "int": to_int,
    "float": to_float,
    "money": to_money,
    "text": lambda x: normalize_space(str(x)) if x is not None else None,
    "region_county": to_region_county,
    "region_sub_county": to_region_sub_county,
}


def get_runtime_config(cfg: dict[str, Any]) -> RuntimeConfig:
    return RuntimeConfig(
        user_agent=cfg.get("user_agent", "HomeItResearchBot/1.0 (+contact: your-email@example.com)"),
        request_timeout_seconds=int(cfg.get("request_timeout_seconds", 20)),
        max_retries=int(cfg.get("max_retries", 3)),
        strict_robots=bool(cfg.get("strict_robots", True)),
    )


def build_robot_parser(base_url: str) -> RobotFileParser | None:
    robots_url = urljoin(base_url, "/robots.txt")
    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        parser.read()
        return parser
    except Exception:
        return None


def can_fetch(url: str, parser: RobotFileParser | None, user_agent: str, strict_robots: bool) -> bool:
    if not strict_robots:
        return True
    if parser is None:
        return False
    try:
        return parser.can_fetch(user_agent, url)
    except Exception:
        return False


def request_with_retry(
    session: requests.Session,
    url: str,
    runtime: RuntimeConfig,
) -> str | None:
    for attempt in range(runtime.max_retries):
        try:
            response = session.get(url, timeout=runtime.request_timeout_seconds)
            if response.status_code == 200:
                return response.text
            if response.status_code in (401, 403):
                return None
        except requests.RequestException:
            pass
        wait = 1.2 * (attempt + 1)
        time.sleep(wait)
    return None


def extract_text(soup: BeautifulSoup, selector: str, attribute: str | None = None) -> str | None:
    node = soup.select_one(selector)
    if not node:
        return None
    if attribute:
        value = node.get(attribute)
        if value is None:
            return None
        return normalize_space(str(value))
    return normalize_space(node.get_text(" ", strip=True))


def extract_listing_links(
    html: str,
    source: dict[str, Any],
) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    selector = source.get("link_selector", "a")
    attr = source.get("link_attribute", "href")
    same_domain_only = bool(source.get("same_domain_only", True))
    base_url = source["base_url"]
    base_domain = urlparse(base_url).netloc.lower()

    links: list[str] = []
    for node in soup.select(selector):
        href = node.get(attr)
        if not href:
            continue
        absolute = urljoin(base_url, href)
        if same_domain_only and urlparse(absolute).netloc.lower() != base_domain:
            continue
        links.append(absolute)
    return sorted(set(links))


def with_query_param(url: str, key: str, value: int) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query[key] = str(value)
    return urlunparse(parsed._replace(query=urlencode(query)))


def parse_listing(
    html: str,
    source: dict[str, Any],
    listing_url: str,
) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    fields = source.get("fields", {})
    record: dict[str, Any] = {}

    for output_field, meta in fields.items():
        selector = meta.get("selector")
        if not selector:
            continue
        raw_value = extract_text(soup, selector, meta.get("attribute"))
        transform_name = meta.get("transform", "text")
        transform = TRANSFORMS.get(transform_name, TRANSFORMS["text"])
        record[output_field] = transform(raw_value)

    record["source_name"] = source["name"]
    record["source_url"] = listing_url
    record["scraped_at_utc"] = datetime.now(timezone.utc).isoformat()
    return record


def legal_gate(source: dict[str, Any]) -> tuple[bool, str]:
    if not bool(source.get("enabled", False)):
        return False, f"{source.get('name', 'unknown')}: skipped (enabled=false)"
    if not bool(source.get("terms_allowed", False)):
        return False, f"{source.get('name', 'unknown')}: skipped (terms_allowed=false)"
    if not source.get("base_url"):
        return False, f"{source.get('name', 'unknown')}: skipped (missing base_url)"
    if not source.get("listing_urls"):
        return False, f"{source.get('name', 'unknown')}: skipped (missing listing_urls)"
    return True, f"{source.get('name', 'unknown')}: passed legal gate"


def scrape_source(
    source: dict[str, Any],
    runtime: RuntimeConfig,
    session: requests.Session,
) -> list[dict[str, Any]]:
    legal_ok, message = legal_gate(source)
    print(message)
    if not legal_ok:
        return []

    parser = build_robot_parser(source["base_url"])
    if parser is None and runtime.strict_robots:
        print(f"{source['name']}: skipped (robots.txt unavailable and strict_robots=true)")
        return []

    records: list[dict[str, Any]] = []
    discovered_links: set[str] = set()
    max_listings = int(source.get("max_listings", 100))
    rate_limit = float(source.get("rate_limit_seconds", 2.0))

    pagination = source.get("pagination", {}) or {}
    pagination_enabled = bool(pagination.get("enabled", False))
    page_param = str(pagination.get("param", "page"))
    start_page = int(pagination.get("start_page", 1))
    end_page = pagination.get("end_page")
    end_page = int(end_page) if end_page is not None else None
    max_pages = int(pagination.get("max_pages", 1 if not pagination_enabled else 1000))
    stop_on_empty_page = bool(pagination.get("stop_on_empty_page", True))
    stop_on_no_new_links = bool(pagination.get("stop_on_no_new_links", True))

    for seed_url in source["listing_urls"]:
        page = start_page
        pages_visited = 0

        while True:
            if end_page is not None and page > end_page:
                break
            if pages_visited >= max_pages:
                break
            if len(discovered_links) >= max_listings:
                break

            listing_page_url = with_query_param(seed_url, page_param, page) if pagination_enabled else seed_url
            pages_visited += 1

            if not can_fetch(listing_page_url, parser, runtime.user_agent, runtime.strict_robots):
                print(f"{source['name']}: blocked by robots {listing_page_url}")
                break

            seed_html = request_with_retry(session, listing_page_url, runtime)
            if not seed_html:
                print(f"{source['name']}: failed to fetch listing page {listing_page_url}")
                break

            page_links = extract_listing_links(seed_html, source)
            new_links = [u for u in page_links if u not in discovered_links]
            for u in new_links:
                discovered_links.add(u)
                if len(discovered_links) >= max_listings:
                    break

            print(
                f"{source['name']}: page {page} links={len(page_links)} "
                f"new={len(new_links)} candidates={len(discovered_links)}"
            )

            # Page-at-a-time scraping: process links found on this page before moving on.
            for listing_url in new_links:
                if len(records) >= max_listings:
                    break
                if not can_fetch(listing_url, parser, runtime.user_agent, runtime.strict_robots):
                    continue
                listing_html = request_with_retry(session, listing_url, runtime)
                if not listing_html:
                    continue
                records.append(parse_listing(listing_html, source, listing_url))
                if len(records) % 25 == 0:
                    print(f"{source['name']}: scraped records so far = {len(records)}")
                time.sleep(rate_limit + random.uniform(0.1, 0.6))

            time.sleep(rate_limit + random.uniform(0.1, 0.6))

            if not pagination_enabled:
                break
            if stop_on_empty_page and len(page_links) == 0:
                break
            if stop_on_no_new_links and len(new_links) == 0:
                break
            if len(discovered_links) >= max_listings:
                break

            page += 1

    print(f"{source['name']}: candidate listing URLs = {len(discovered_links)}")
    print(f"{source['name']}: scraped records = {len(records)}")
    return records


def canonicalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    mapping = {
        "property_type": "Type of Resudential Property",
        "bedrooms": "No. bedrooms",
        "bathrooms": "No. Bathrooms",
        "floor_area_square_meters": "Floor area Square Meters",
        "county": "County Located",
        "sub_county": "Sub County Located",
        "advertised_price": "Advertised Price",
        "year_property_advertised": "Year property was advertised",
        "land_size_acres": "Land Size where property is built on (Acres)",
        "year_house_completion": "Year of house construction completion",
    }
    present_mapping = {k: v for k, v in mapping.items() if k in df.columns}
    return df.rename(columns=present_mapping)


def clean_records(records: list[dict[str, Any]]) -> pd.DataFrame:
    if not records:
        return pd.DataFrame()

    df = pd.DataFrame(records)
    df = canonicalize_columns(df)

    numeric_cols = [
        "No. bedrooms",
        "No. Bathrooms",
        "Floor area Square Meters",
        "Advertised Price",
        "Year property was advertised",
        "Land Size where property is built on (Acres)",
        "Year of house construction completion",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "source_url" in df.columns:
        df = df.drop_duplicates(subset=["source_url"])

    if "Advertised Price" in df.columns:
        df = df[df["Advertised Price"].notna()]

    # Keep cleaned training data focused on model features only.
    drop_clean_only_cols = [c for c in ["source_name", "source_url", "scraped_at_utc"] if c in df.columns]
    if drop_clean_only_cols:
        df = df.drop(columns=drop_clean_only_cols)

    return df.reset_index(drop=True)


def load_existing_dataset(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path)
    if suffix in (".xlsx", ".xls"):
        return pd.read_excel(path)
    raise ValueError(f"Unsupported merge file type: {path}")


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def dedupe_raw_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not records:
        return []
    seen_urls: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for row in records:
        url = str(row.get("source_url", "")).strip()
        if url:
            if url in seen_urls:
                continue
            seen_urls.add(url)
        deduped.append(row)
    return deduped


def save_dataset(df: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    suffix = path.suffix.lower()
    if suffix == ".csv":
        df.to_csv(path, index=False)
    elif suffix in (".xlsx", ".xls"):
        df.to_excel(path, index=False)
    else:
        raise ValueError(f"Unsupported output file type: {path}")


def merge_with_existing(existing: pd.DataFrame, scraped: pd.DataFrame) -> pd.DataFrame:
    if scraped.empty:
        return existing.copy()

    merged = pd.concat([existing, scraped], ignore_index=True, sort=False)

    dedupe_keys = [c for c in ["source_url", "Advertised Price", "No. bedrooms", "Type of Resudential Property"] if c in merged.columns]
    if dedupe_keys:
        merged = merged.drop_duplicates(subset=dedupe_keys, keep="first")
    else:
        merged = merged.drop_duplicates()

    return merged.reset_index(drop=True)


def run(
    config_path: Path,
    output_dir: Path,
    merge_target: Path | None,
    merge_output: Path | None,
    append_output: bool,
) -> None:
    cfg = load_yaml(config_path)
    runtime = get_runtime_config(cfg)
    sources = cfg.get("sources", [])

    output_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers.update({"User-Agent": runtime.user_agent})

    all_records: list[dict[str, Any]] = []
    for source in sources:
        records = scrape_source(source, runtime, session)
        all_records.extend(records)

    raw_path = output_dir / "raw_records.jsonl"
    if append_output:
        existing_raw = load_jsonl(raw_path)
        raw_to_save = dedupe_raw_records(existing_raw + all_records)
    else:
        raw_to_save = dedupe_raw_records(all_records)

    with raw_path.open("w", encoding="utf-8") as f:
        for row in raw_to_save:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    cleaned_new_df = clean_records(all_records)
    cleaned_csv = output_dir / "cleaned_records.csv"
    if append_output and cleaned_csv.exists():
        try:
            existing_cleaned = pd.read_csv(cleaned_csv)
            cleaned_df = merge_with_existing(existing_cleaned, cleaned_new_df)
        except Exception:
            cleaned_df = cleaned_new_df
    else:
        cleaned_df = cleaned_new_df
    cleaned_df.to_csv(cleaned_csv, index=False)

    print(f"raw records saved: {raw_path} (rows={len(raw_to_save)})")
    print(f"cleaned records saved: {cleaned_csv} (rows={len(cleaned_df)})")

    if merge_target is not None:
        existing_df = load_existing_dataset(merge_target)
        merged_df = merge_with_existing(existing_df, cleaned_df)
        if merge_output is None:
            merge_output = output_dir / f"merged{merge_target.suffix.lower()}"
        save_dataset(merged_df, merge_output)
        print(f"merged dataset saved: {merge_output} (rows={len(merged_df)})")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Legal real-estate scraping pipeline with robots/ToS safeguards."
    )
    parser.add_argument(
        "--config",
        required=True,
        type=Path,
        help="Path to YAML source config.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("output"),
        help="Directory for raw and cleaned output files.",
    )
    parser.add_argument(
        "--merge-target",
        type=Path,
        default=None,
        help="Optional existing dataset (.csv or .xlsx) to append scraped rows into.",
    )
    parser.add_argument(
        "--merge-output",
        type=Path,
        default=None,
        help="Optional merged output path (.csv or .xlsx). Defaults to output/merged.*",
    )
    parser.add_argument(
        "--append-output",
        action="store_true",
        help="Append new results to existing output files (with dedupe by source_url).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(args.config, args.output_dir, args.merge_target, args.merge_output, args.append_output)

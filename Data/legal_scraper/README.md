# Legal Real-Estate Scraper Pipeline

This pipeline is for collecting property listings **only from sources where you have permission**.

It enforces legal safeguards:
- Requires `enabled: true` and `terms_allowed: true` per source.
- Checks `robots.txt` before fetching pages.
- Uses a clear custom user-agent.
- Supports rate-limiting and retry.

## 1) Install

```powershell
cd Data\legal_scraper
pip install -r requirements.txt
```

## 2) Create your source config

Copy and edit:

```powershell
Copy-Item sources.example.yaml sources.yaml
```

Then in `sources.yaml`:
1. Set your contact email in `user_agent`.
2. Add only websites whose terms allow scraping.
3. Set each approved source to:
   - `enabled: true`
   - `terms_allowed: true`
4. Fill CSS selectors for listing links and fields.
5. Configure pagination if the site has many result pages:
   - `pagination.enabled: true`
   - `pagination.param: "page"`
   - `pagination.start_page: 1`
   - `pagination.max_pages: ...`

## 3) Run scraper

```powershell
python scrape_pipeline.py --config sources.yaml --output-dir output
```

Append mode (keeps previous runs and adds new rows):

```powershell
python scrape_pipeline.py --config sources.yaml --output-dir output --append-output
```

Outputs:
- `output\raw_records.jsonl` (raw extracted JSON lines)
- `output\cleaned_records.csv` (normalized tabular data)

The scraper now runs **page-by-page**:
1. Fetch listing page `?page=N`
2. Extract links on that page
3. Scrape those detail pages
4. Move to next page

## 4) Merge with your current dataset

```powershell
python scrape_pipeline.py `
  --config sources.yaml `
  --output-dir output `
  --merge-target ..\Real_Estate_Dataset_Clean_Nairobi.xlsx `
  --merge-output output\merged_real_estate.xlsx
```

## 5) Use merged data for model training

Point your training script to:
- `output\merged_real_estate.xlsx` (if merged), or
- `output\cleaned_records.csv`.

## Recommended minimum quality before retraining

For better model performance, ensure your merged data has:
1. `Advertised Price`
2. `Type of Resudential Property`
3. `No. bedrooms`
4. `Sub County Located`
5. `Floor area Square Meters`
6. `Year of house construction completion` (or property age)

Try to keep missingness for fields 4-6 below ~30% in the training set.

## Important legal notes

- You must comply with each site's Terms of Service.
- Respect robots directives and rate limits.
- Do not scrape personal data beyond what is necessary for pricing analytics.
- Keep source URLs for auditability (`source_url` is included by default).

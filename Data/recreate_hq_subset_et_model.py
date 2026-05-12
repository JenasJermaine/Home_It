import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


def build_dataset(xlsx_path: Path) -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_excel(xlsx_path)

    numeric_columns = [
        "No. bedrooms",
        "No. Bathrooms",
        "Floor area Square Meters",
        "Advertised Price",
        "Year property was advertised",
        "Land Size where property is built on (Acres)",
        "Year of house construction completion",
    ]
    for column in numeric_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(df[column], errors="coerce")

    # Same high-quality subset rule used earlier.
    required_core = [
        "Type of Resudential Property",
        "No. bedrooms",
        "Sub County Located",
        "Floor area Square Meters",
        "Advertised Price",
    ]
    df = df.dropna(subset=required_core).copy()

    y = df["Advertised Price"]
    X = df.drop(columns=["Advertised Price"])
    return X, y


def build_model(X: pd.DataFrame) -> TransformedTargetRegressor:
    numeric_columns = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_columns = [c for c in X.columns if c not in numeric_columns]

    preprocess = ColumnTransformer(
        transformers=[
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median"))]), numeric_columns),
            (
                "cat",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_columns,
            ),
        ],
        remainder="drop",
    )

    model = ExtraTreesRegressor(
        n_estimators=1200,
        max_depth=20,
        min_samples_leaf=1,
        max_features=1.0,
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline([("preprocess", preprocess), ("model", model)])
    return TransformedTargetRegressor(
        regressor=pipeline,
        func=np.log1p,
        inverse_func=np.expm1,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Recreate the high-quality subset ExtraTrees house-price model."
    )
    parser.add_argument(
        "--input",
        default=r"Data\Real_Estate_Dataset_Clean_Nairobi.xlsx",
        help="Path to the Nairobi Excel dataset.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Test split fraction.",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for train/test split.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    X, y = build_dataset(input_path)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.random_state
    )

    regressor = build_model(X)
    regressor.fit(X_train, y_train)
    predictions = regressor.predict(X_test)

    r2 = r2_score(y_test, predictions)
    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5

    print(f"input_file={input_path}")
    print(f"rows_used={len(X)}")
    print(f"train_rows={len(X_train)}")
    print(f"test_rows={len(X_test)}")
    print("model=ExtraTreesRegressor + log1p target + one-hot preprocessing")
    print(f"R2={r2:.4f}")
    print(f"MAE={mae:.2f}")
    print(f"RMSE={rmse:.2f}")


if __name__ == "__main__":
    main()

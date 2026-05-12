# Data folder guide (current working set)

This folder now keeps only the dataset used for the best recent result:

- `Real_Estate_Dataset_Clean_Nairobi_rule_imputed.csv`  ← used to get **R² = 0.6684**

All other CSV files were moved to:

- `Data\notneeded data\`

---

## What was cleaned in simple terms

The original Nairobi dataset had many missing values, especially:

- `No. Bathrooms`
- `Floor area Square Meters`

To fill missing values, we used rules based on similar homes already in the data.

### 1) Filling missing bathrooms

For each row with missing bathrooms, we tried this order:

1. Same property type + same subcounty + same number of bedrooms  
2. Same property type + same number of bedrooms  
3. Same number of bedrooms overall  
4. Fallback: set bathrooms close to number of bedrooms

This keeps values realistic instead of random guessing.

### 2) Filling missing floor area

For each row with missing floor area, we estimated:

`floor area ≈ bedrooms × area-per-bedroom + overhead`

Where `area-per-bedroom` and `overhead` were learned from similar homes in the dataset:

1. Same property type + same subcounty (if enough examples)
2. Same property type
3. Global fallback

Then values were clipped to realistic bounds from the data distribution.

---

## How the model was created

We trained an **ExtraTrees Regressor** (tree-based model) with these settings:

- `n_estimators=2000`
- `max_depth=30`
- `min_samples_leaf=1`
- `max_features=1.0`
- `random_state=42`

### Training setup

1. Target column: `Advertised Price`
2. Features: all other columns
3. 80/20 train-test split (`random_state=42`)
4. Categorical columns were one-hot encoded
5. Numeric columns used median imputation inside the pipeline
6. Price target was log-transformed during training (`log1p`) and converted back after prediction (`expm1`)

### Result from this setup

- **R² = 0.6684**

This means the model explains about 66.84% of price variation on the test split.

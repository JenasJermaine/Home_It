# Home_It ML Predictor (FastAPI)

This service loads the trained house-price model from:

- `Data/real_estate_et_model_r2_06684.pkl`

and exposes:

- `GET /health` - health/model loaded check
- `GET /model-metadata` - expected feature columns + model R2
- `POST /predict` - return predicted house price

## 1) Install dependencies

From project root:

```powershell
python -m pip install -r ml_api\requirements.txt
```

## 2) Run the API

From project root:

```powershell
python -m uvicorn ml_api.app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 3) Quick test

```powershell
curl http://localhost:8001/health
```

## 4) Predict endpoint example

```json
{
  "property_type": "Apartment",
  "bedrooms": 3,
  "bathrooms": 2,
  "parking_lot_present": 1,
  "designated_servant_quarter_present": 0,
  "cctvs_present": 1,
  "elevator_present": 1,
  "garden_backyard_play_area_present": 0,
  "swimming_pool_present": 0,
  "backup_generator_present": 1,
  "fixed_internet_infrastructure_present": 1,
  "solar_water_heating_system_present": 0,
  "solar_lighting_system_present": 0,
  "gym_present": 1,
  "fire_safety_precautions_present": 1,
  "solar_security_lighting": 0,
  "access_ramp_present": 1,
  "county": "Nairobi",
  "subcounty": "Westlands",
  "floor_area_square_meters": 150,
  "year_property_was_advertised": 2026,
  "land_size_acres": 0.12,
  "year_of_house_construction_completion": 2019
}
```

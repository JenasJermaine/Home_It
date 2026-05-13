import os
import pickle
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_PATH = ROOT_DIR / "Data" / "real_estate_et_model_r2_06684.pkl"
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH)))


def _normalize_binary(value: Any, field_name: str) -> int:
    if isinstance(value, bool):
        return int(value)

    if isinstance(value, (int, float)) and value in (0, 1):
        return int(value)

    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "y", "present"}:
            return 1
        if normalized in {"0", "false", "no", "n", "absent"}:
            return 0

    raise ValueError(
        f"{field_name} must be one of: 0, 1, true, false, yes, no, present, absent."
    )


class PredictRequest(BaseModel):
    property_type: str = Field(min_length=1, description="Type of residential property")
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=0)
    parking_lot_present: int
    designated_servant_quarter_present: int
    cctvs_present: int
    elevator_present: int
    garden_backyard_play_area_present: int
    swimming_pool_present: int
    backup_generator_present: int
    fixed_internet_infrastructure_present: int
    solar_water_heating_system_present: int
    solar_lighting_system_present: int
    gym_present: int
    fire_safety_precautions_present: int
    solar_security_lighting: int
    access_ramp_present: int
    county: str = Field(min_length=1)
    subcounty: str = Field(min_length=1)
    floor_area_square_meters: float = Field(gt=0)
    year_property_was_advertised: int = Field(ge=1900, le=2100)
    land_size_acres: float = Field(gt=0)
    year_of_house_construction_completion: int = Field(ge=1800, le=2100)

    @field_validator(
        "parking_lot_present",
        "designated_servant_quarter_present",
        "cctvs_present",
        "elevator_present",
        "garden_backyard_play_area_present",
        "swimming_pool_present",
        "backup_generator_present",
        "fixed_internet_infrastructure_present",
        "solar_water_heating_system_present",
        "solar_lighting_system_present",
        "gym_present",
        "fire_safety_precautions_present",
        "solar_security_lighting",
        "access_ramp_present",
        mode="before",
    )
    @classmethod
    def validate_binary_fields(cls, value: Any, info):
        return _normalize_binary(value, info.field_name)

    def to_model_feature_row(self) -> dict[str, Any]:
        return {
            "Type of Resudential Property": self.property_type,
            "No. bedrooms": self.bedrooms,
            "No. Bathrooms": self.bathrooms,
            "Parking Lot Present": self.parking_lot_present,
            "Designated Servant Quarter Present": self.designated_servant_quarter_present,
            "CCTVs present": self.cctvs_present,
            "Elevator Present": self.elevator_present,
            "Garden Barkyad / Play Area Present": self.garden_backyard_play_area_present,
            "Swimming Pool Present": self.swimming_pool_present,
            "Back Up Generator Present": self.backup_generator_present,
            "Fixed Internet Infrastructure Present": self.fixed_internet_infrastructure_present,
            "Solar Water Heating System Present": self.solar_water_heating_system_present,
            "Solar Lighting System Present": self.solar_lighting_system_present,
            "Gym Present": self.gym_present,
            "Fire Safety Precaustions Present": self.fire_safety_precautions_present,
            "Solar Security Lighting": self.solar_security_lighting,
            "Access Ramp Present": self.access_ramp_present,
            "County Located": self.county,
            "Sub County Located": self.subcounty,
            "Floor area Square Meters": self.floor_area_square_meters,
            "Year property was advertised": self.year_property_was_advertised,
            "Land Size where property is built on (Acres)": self.land_size_acres,
            "Year of house construction completion": self.year_of_house_construction_completion,
        }


class PredictResponse(BaseModel):
    predicted_price: float
    currency: str = "KES"
    model_r2: float | None = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: str


app = FastAPI(title="Home_It Price Predictor API", version="1.0.0")
app.state.model = None
app.state.feature_columns = []
app.state.model_r2 = None


@app.on_event("startup")
def load_model() -> None:
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")

    with MODEL_PATH.open("rb") as model_file:
        artifact = pickle.load(model_file)

    if not isinstance(artifact, dict) or "model" not in artifact:
        raise RuntimeError("Invalid model artifact format. Expected a dict containing 'model'.")

    model = artifact["model"]
    feature_columns = artifact.get("feature_columns")
    if not isinstance(feature_columns, list) or len(feature_columns) == 0:
        raise RuntimeError("Model artifact is missing a valid 'feature_columns' list.")

    app.state.model = model
    app.state.feature_columns = feature_columns
    app.state.model_r2 = artifact.get("r2")


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=app.state.model is not None,
        model_path=str(MODEL_PATH),
    )


@app.get("/model-metadata")
def model_metadata() -> dict[str, Any]:
    return {
        "feature_columns": app.state.feature_columns,
        "model_r2": app.state.model_r2,
    }


@app.post("/predict", response_model=PredictResponse)
def predict_price(payload: PredictRequest) -> PredictResponse:
    if app.state.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    try:
        row = payload.to_model_feature_row()
        inference_frame = pd.DataFrame([row], columns=app.state.feature_columns)
        prediction = app.state.model.predict(inference_frame)
        predicted_price = float(prediction[0])
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {error}") from error

    return PredictResponse(predicted_price=predicted_price, model_r2=app.state.model_r2)

from __future__ import annotations

from enum import IntEnum

from tortoise import fields, models


class PriceLevel(IntEnum):
    FREE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class Place(models.Model):
    id = fields.IntField(pk=True)
    external_id = fields.CharField(max_length=16, unique=True, null=True)
    name = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    city = fields.CharField(max_length=128)
    gmina = fields.CharField(max_length=128)
    address_line = fields.CharField(max_length=512, null=True)
    latitude = fields.FloatField(null=True)
    longitude = fields.FloatField(null=True)
    coords_source = fields.CharField(max_length=64, null=True)
    category = fields.CharField(max_length=64)
    secondary_categories = fields.TextField(null=True)
    is_indoor = fields.BooleanField()
    is_outdoor = fields.BooleanField()
    adult_only = fields.BooleanField(default=False)
    min_age_recommended = fields.SmallIntField(null=True)
    typical_visit_minutes = fields.IntField()
    typical_visit_estimated = fields.BooleanField(default=False, null=True)
    price_level = fields.IntEnumField(PriceLevel)
    price_max_pln = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
    price_notes = fields.TextField(null=True)
    participation_mode = fields.CharField(max_length=32, null=True)
    public_access = fields.CharField(max_length=16, null=True)
    gastro_intensity = fields.SmallIntField(default=0)
    game_interactivity = fields.SmallIntField(default=0)
    physical_activity_level = fields.SmallIntField(default=0)
    cultural_education = fields.SmallIntField(default=0)
    nature_relaxation = fields.SmallIntField(default=0)
    family_friendly = fields.SmallIntField(default=0)
    rain_suitable = fields.SmallIntField(default=0)
    tags = fields.TextField(null=True)
    official_url = fields.CharField(max_length=512, null=True)
    booking_url = fields.CharField(max_length=512, null=True)
    source_urls = fields.TextField(null=True)
    verification_status = fields.CharField(max_length=32, null=True)
    missing_fields = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    opening_hours: fields.ReverseRelation[OpeningHours]
    route_stops: fields.ReverseRelation[RouteStop]
    events: fields.ReverseRelation[Event]

    class Meta:
        table = "place"


class OpeningHours(models.Model):
    id = fields.IntField(pk=True)
    place: fields.ForeignKeyRelation[Place] = fields.ForeignKeyField(
        "models.Place",
        related_name="opening_hours",
        on_delete=fields.CASCADE,
    )
    day_of_week = fields.SmallIntField()
    opens_at = fields.CharField(max_length=5)
    closes_at = fields.CharField(max_length=5)
    season_note = fields.TextField(null=True)
    source_url = fields.CharField(max_length=512, null=True)

    class Meta:
        table = "opening_hours"
        indexes = (("place_id", "day_of_week"),)


class PredefinedRoute(models.Model):
    id = fields.IntField(pk=True)
    external_id = fields.CharField(max_length=16, unique=True, null=True)
    name = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    duration_minutes_approx = fields.IntField()
    stops_min = fields.IntField()
    stops_max = fields.IntField()
    city = fields.CharField(max_length=128)
    gmina = fields.CharField(max_length=128)
    price_level_max = fields.IntEnumField(PriceLevel, null=True)
    route_type = fields.CharField(max_length=32, null=True)
    category = fields.CharField(max_length=64, null=True)
    source_url = fields.CharField(max_length=512, null=True)

    stops: fields.ReverseRelation[RouteStop]

    class Meta:
        table = "predefined_route"


class RouteStop(models.Model):
    id = fields.IntField(pk=True)
    route: fields.ForeignKeyRelation[PredefinedRoute] = fields.ForeignKeyField(
        "models.PredefinedRoute",
        related_name="stops",
        on_delete=fields.CASCADE,
    )
    place: fields.ForeignKeyRelation[Place] = fields.ForeignKeyField(
        "models.Place",
        related_name="route_stops",
        on_delete=fields.CASCADE,
    )
    sequence = fields.IntField()
    dwell_minutes = fields.IntField(null=True)

    class Meta:
        table = "route_stop"
        unique_together = (("route_id", "sequence"),)


class Event(models.Model):
    id = fields.IntField(pk=True)
    external_id = fields.CharField(max_length=16, unique=True)
    name = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    place: fields.ForeignKeyRelation[Place] | None = fields.ForeignKeyField(
        "models.Place",
        related_name="events",
        on_delete=fields.SET_NULL,
        null=True,
    )
    venue_name = fields.CharField(max_length=255, null=True)
    address_line = fields.CharField(max_length=512, null=True)
    city = fields.CharField(max_length=128, null=True)
    gmina = fields.CharField(max_length=128, null=True)
    latitude = fields.FloatField(null=True)
    longitude = fields.FloatField(null=True)
    start_date = fields.DateField()
    start_time = fields.CharField(max_length=5, null=True)
    end_time = fields.CharField(max_length=5, null=True)
    category = fields.CharField(max_length=64, null=True)
    sport = fields.CharField(max_length=64, null=True)
    competition = fields.CharField(max_length=128, null=True)
    age_group = fields.CharField(max_length=32, null=True)
    gender = fields.CharField(max_length=16, null=True)
    home_team = fields.CharField(max_length=128, null=True)
    away_team = fields.CharField(max_length=128, null=True)
    price_level = fields.IntEnumField(PriceLevel, null=True)
    price_max_pln = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
    is_free = fields.BooleanField(default=False)
    participation_mode = fields.CharField(max_length=32, null=True)
    status = fields.CharField(max_length=32, null=True)
    official_url = fields.CharField(max_length=512, null=True)
    booking_url = fields.CharField(max_length=512, null=True)
    source_url = fields.CharField(max_length=512, null=True)

    class Meta:
        table = "event"


class CatalogSource(models.Model):
    id = fields.IntField(pk=True)
    url = fields.CharField(max_length=2048, unique=True)
    accessed_at = fields.DatetimeField(null=True)
    status = fields.CharField(max_length=32, null=True)
    what_it_confirms = fields.TextField(null=True)

    class Meta:
        table = "catalog_source"


class NeedsVerificationItem(models.Model):
    id = fields.IntField(pk=True)
    record_external_id = fields.CharField(max_length=16)
    source_file = fields.CharField(max_length=64)
    issue = fields.TextField()
    fields = fields.TextField(null=True)

    class Meta:
        table = "needs_verification"


__all__ = [
    "CatalogSource",
    "Event",
    "NeedsVerificationItem",
    "OpeningHours",
    "Place",
    "PredefinedRoute",
    "PriceLevel",
    "RouteStop",
]

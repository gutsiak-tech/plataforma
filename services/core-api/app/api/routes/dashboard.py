from fastapi import APIRouter, Query

from app.services.dashboard_service import (
    dashboard_table,
    distribution,
    heatmap_salary_sector_age,
    kpi_panel,
    kpis,
    ranking,
    salary_box_by_education,
    salary_by_age_gender,
    summary,
    timeseries,
    timeseries_saldo,
    top_bottom,
    top_countries,
    top_municipios_mov,
    treemap_sector_country,
)

router = APIRouter()


@router.get("/api/dashboard/summary")
def dashboard_summary(
    uf: str = Query("PR", description="UF code"),
    competencia: str = Query(..., description="YYYY-MM"),
):
    return summary(uf, competencia)


@router.get("/api/dashboard/top_bottom")
def dashboard_top_bottom(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
):
    return top_bottom(uf, competencia)


@router.get("/api/dashboard/kpis")
def dashboard_kpis(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
):
    return kpis(uf, competencia)


@router.get("/api/dashboard/ranking")
def dashboard_ranking(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
    limit: int = Query(100, ge=1, le=500),
    order: str = Query("desc", description="desc for top, asc for bottom"),
):
    return ranking(uf, competencia, limit, order)


@router.get("/api/dashboard/distribution")
def dashboard_distribution(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
    bins: int = Query(20, ge=5, le=60),
):
    return distribution(uf, competencia, bins)


@router.get("/api/dashboard/timeseries")
def dashboard_timeseries(
    uf: str = Query("PR"),
    limit: int = Query(24, ge=3, le=120),
):
    return timeseries(uf, limit)


@router.get("/api/dashboard/kpi_panel")
def dashboard_kpi_panel(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
):
    return kpi_panel(uf, competencia)


@router.get("/api/dashboard/top_countries")
def dashboard_top_countries(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
    top_n: int = Query(10, ge=5, le=20),
):
    return top_countries(uf, competencia, top_n)


@router.get("/api/dashboard/salary_by_age_gender")
def dashboard_salary_by_age_gender(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
):
    return salary_by_age_gender(uf, competencia)


@router.get("/api/dashboard/salary_box_by_education")
def dashboard_salary_box_by_education(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
):
    return salary_box_by_education(uf, competencia)


@router.get("/api/dashboard/treemap_sector_country")
def dashboard_treemap_sector_country(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
):
    return treemap_sector_country(uf, competencia)


@router.get("/api/dashboard/timeseries_saldo")
def dashboard_timeseries_saldo(
    uf: str = Query("PR"),
    from_: str | None = Query(None, alias="from"),
    to: str | None = Query(None, alias="to"),
):
    return timeseries_saldo(uf, from_, to)


@router.get("/api/dashboard/heatmap_salary_sector_age")
def dashboard_heatmap_salary_sector_age(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
):
    return heatmap_salary_sector_age(uf, competencia)


@router.get("/api/dashboard/top_municipios_mov")
def dashboard_top_municipios_mov(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
    top_n: int = Query(10, ge=5, le=25),
):
    return top_municipios_mov(uf, competencia, top_n)


@router.get("/api/dashboard/table")
def dashboard_table_route(
    uf: str = Query("PR"),
    competencia: str = Query(..., description="YYYY-MM"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    sort: str = Query("saldo_sum:desc"),
):
    return dashboard_table(uf, competencia, limit, offset, sort)

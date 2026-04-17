import { apiFetch } from "./client"

export const getScorers    = () => apiFetch("/stats/scorers")
export const getAssists    = () => apiFetch("/stats/assists")
export const getExpulsions = () => apiFetch("/stats/expulsions")
export const getMinutes    = () => apiFetch("/stats/minutes")

export const getStandingsApertura        = () => apiFetch("/stats/standings/apertura")
export const getStandingsClausura        = () => apiFetch("/stats/standings/clausura")
export const getStandingsIntermedioA     = () => apiFetch("/stats/standings/intermedio/A")
export const getStandingsIntermedioB     = () => apiFetch("/stats/standings/intermedio/B")
export const getStandingsAnual           = () => apiFetch("/stats/standings/anual")
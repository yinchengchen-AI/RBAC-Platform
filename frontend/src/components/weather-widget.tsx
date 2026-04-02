import { useEffect, useState } from 'react'
import { Spin, Tooltip } from 'antd'
import { EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons'

interface WeatherData {
  city: string
  temp: number
  humidity: number
  windSpeed: number
  weatherCode: number
}

function getWeatherLabel(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: '晴' }
  if (code <= 3) return { emoji: '⛅', label: '多云' }
  if (code <= 48) return { emoji: '🌫️', label: '雾' }
  if (code <= 55) return { emoji: '🌦️', label: '小雨' }
  if (code <= 65) return { emoji: '🌧️', label: '雨' }
  if (code <= 77) return { emoji: '❄️', label: '雪' }
  if (code <= 82) return { emoji: '🌦️', label: '阵雨' }
  return { emoji: '⛈️', label: '雷雨' }
}

async function fetchWeather(): Promise<WeatherData> {
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
  )
  const { latitude: lat, longitude: lon } = pos.coords

  const [geoRes, weatherRes] = await Promise.all([
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`),
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
    ),
  ])

  const geoData = await geoRes.json()
  const weatherData = await weatherRes.json()

  const city =
    geoData.address?.city ||
    geoData.address?.county ||
    geoData.address?.state ||
    '未知城市'

  const cur = weatherData.current
  return {
    city,
    temp: Math.round(cur.temperature_2m),
    humidity: cur.relative_humidity_2m,
    windSpeed: Math.round(cur.wind_speed_10m),
    weatherCode: cur.weather_code,
  }
}

export function WeatherWidget() {
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    fetchWeather()
      .then(setWeather)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8c8c8c' }}>
        <Spin size="small" />
        <span style={{ fontSize: 13 }}>获取天气…</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <Tooltip title="点击重试">
        <div
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#8c8c8c' }}
        >
          <ReloadOutlined />
          <span style={{ fontSize: 13 }}>天气获取失败</span>
        </div>
      </Tooltip>
    )
  }

  const { emoji, label } = getWeatherLabel(weather.weatherCode)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 36, lineHeight: 1 }}>{emoji}</span>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>
            {weather.temp}°
          </span>
          <span style={{ fontSize: 14, color: '#595959' }}>{label}</span>
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
          <EnvironmentOutlined style={{ marginRight: 3 }} />
          {weather.city} · 湿度 {weather.humidity}%
        </div>
      </div>
    </div>
  )
}

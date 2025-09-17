/**
 * Comprehensive weather simulation system
 * Implements realistic weather patterns, temperature cycles, and precipitation
 */

export interface WeatherState {
  temperature: number;        // Celsius
  humidity: number;          // 0-1
  pressure: number;          // kPa
  windSpeed: number;         // m/s
  windDirection: number;     // degrees (0-360)
  precipitation: number;     // mm/hour
  cloudCover: number;        // 0-1
  visibility: number;        // meters
  uvIndex: number;           // 0-12
}

export interface WeatherForecast {
  timestamp: number;
  duration: number;          // Duration in milliseconds
  weather: WeatherState;
  probability: number;       // Forecast confidence (0-1)
}

export interface SeasonalConfig {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  dayLength: number;         // Hours of daylight
  avgTemperature: number;    // Average temperature for season
  tempVariation: number;     // Daily temperature variation
  precipitationChance: number; // Base chance of rain
  stormFrequency: number;    // Storm probability
}

export interface ClimateZone {
  name: string;
  latitude: number;          // -90 to 90
  elevation: number;         // meters above sea level
  proximity_to_water: number; // 0-1, affects humidity
  seasonal_configs: Map<string, SeasonalConfig>;
}

export class WeatherSystem {
  private currentWeather: WeatherState;
  private forecast: WeatherForecast[] = [];
  private climateZone: ClimateZone;
  private currentSeason: SeasonalConfig;
  private timeOfYear: number = 0; // 0-1, where 0 is start of year
  private timeOfDay: number = 0;  // 0-24 hours
  
  // Weather generation parameters
  private readonly FORECAST_HOURS = 24;
  private readonly UPDATE_INTERVAL = 300000; // 5 minutes
  private readonly WEATHER_PERSISTENCE = 0.7; // How much weather persists
  
  private lastUpdate: number = 0;
  private weatherHistory: Array<{timestamp: number, weather: WeatherState}> = [];

  constructor(climateZone: ClimateZone, initialDate: Date = new Date()) {
    this.climateZone = climateZone;
    this.setTimeFromDate(initialDate);
    this.currentSeason = this.getCurrentSeasonConfig();
    this.currentWeather = this.generateInitialWeather();
    this.generateForecast();
  }

  private setTimeFromDate(date: Date): void {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    this.timeOfYear = dayOfYear / 365;
    
    this.timeOfDay = date.getHours() + date.getMinutes() / 60;
  }

  private getCurrentSeasonConfig(): SeasonalConfig {
    let season: 'spring' | 'summer' | 'autumn' | 'winter';
    
    if (this.timeOfYear < 0.25) season = 'spring';
    else if (this.timeOfYear < 0.5) season = 'summer';
    else if (this.timeOfYear < 0.75) season = 'autumn';
    else season = 'winter';
    
    return this.climateZone.seasonal_configs.get(season) || this.getDefaultSeasonConfig(season);
  }

  private getDefaultSeasonConfig(season: string): SeasonalConfig {
    const defaults = {
      spring: {
        season: 'spring' as const,
        dayLength: 12,
        avgTemperature: 15,
        tempVariation: 8,
        precipitationChance: 0.3,
        stormFrequency: 0.1,
      },
      summer: {
        season: 'summer' as const,
        dayLength: 16,
        avgTemperature: 25,
        tempVariation: 10,
        precipitationChance: 0.2,
        stormFrequency: 0.15,
      },
      autumn: {
        season: 'autumn' as const,
        dayLength: 10,
        avgTemperature: 12,
        tempVariation: 6,
        precipitationChance: 0.4,
        stormFrequency: 0.12,
      },
      winter: {
        season: 'winter' as const,
        dayLength: 8,
        avgTemperature: 2,
        tempVariation: 5,
        precipitationChance: 0.25,
        stormFrequency: 0.08,
      },
    };
    
    return defaults[season as keyof typeof defaults];
  }

  private generateInitialWeather(): WeatherState {
    const season = this.currentSeason;
    
    const weather = {
      temperature: this.generateTemperature(),
      humidity: 0.4 + Math.random() * 0.4 + this.climateZone.proximity_to_water * 0.2,
      pressure: 101.325 + (Math.random() - 0.5) * 5, // Standard pressure ± variation
      windSpeed: Math.random() * 10,
      windDirection: Math.random() * 360,
      precipitation: Math.random() < season.precipitationChance ? Math.random() * 5 : 0,
      cloudCover: Math.random(),
      visibility: 1000 + Math.random() * 9000,
      uvIndex: 0, // Will be calculated after weather object is complete
    };
    
    // Now calculate UV index with complete weather data
    weather.uvIndex = this.calculateUVIndexForWeather(weather);
    return weather;
  }

  private generateTemperature(): number {
    const season = this.currentSeason;
    const baseTemp = season.avgTemperature;
    
    // Daily temperature cycle
    const timeInRadians = (this.timeOfDay / 24) * 2 * Math.PI;
    const dailyCycle = Math.sin(timeInRadians - Math.PI / 2); // Peak at ~2 PM
    const dailyVariation = dailyCycle * (season.tempVariation / 2);
    
    // Seasonal variation within the season
    const seasonalVariation = (Math.random() - 0.5) * season.tempVariation;
    
    // Elevation effect (temperature drops with altitude)
    const elevationEffect = -(this.climateZone.elevation / 1000) * 6.5; // 6.5°C per 1000m
    
    return baseTemp + dailyVariation + seasonalVariation + elevationEffect;
  }

  private calculateUVIndex(): number {
    // UV depends on time of day, season, cloud cover, and elevation
    let uvIndex = 0;
    
    // Base UV from sun angle
    if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
      const sunAngle = Math.sin(((this.timeOfDay - 6) / 12) * Math.PI);
      uvIndex = sunAngle * 12; // Max UV of 12
    }
    
    // Seasonal adjustment
    const seasonalMultiplier = 0.5 + Math.sin((this.timeOfYear - 0.25) * 2 * Math.PI) * 0.4;
    uvIndex *= seasonalMultiplier;
    
    // Cloud cover reduces UV
    uvIndex *= (1 - this.currentWeather.cloudCover * 0.7);
    
    // Elevation increases UV
    uvIndex *= (1 + this.climateZone.elevation / 10000);
    
    return Math.max(0, Math.min(12, uvIndex));
  }

  private calculateUVIndexForWeather(weather: WeatherState): number {
    // UV depends on time of day, season, cloud cover, and elevation
    let uvIndex = 0;
    
    // Base UV from sun angle
    if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
      const sunAngle = Math.sin(((this.timeOfDay - 6) / 12) * Math.PI);
      uvIndex = sunAngle * 12; // Max UV of 12
    }
    
    // Seasonal adjustment
    const seasonalMultiplier = 0.5 + Math.sin((this.timeOfYear - 0.25) * 2 * Math.PI) * 0.4;
    uvIndex *= seasonalMultiplier;
    
    // Cloud cover reduces UV (use provided weather instead of instance)
    uvIndex *= (1 - weather.cloudCover * 0.7);
    
    // Elevation increases UV
    uvIndex *= (1 + this.climateZone.elevation / 10000);
    
    return Math.max(0, Math.min(12, uvIndex));
  }

  /**
   * Update weather system
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();
    
    if (currentTime - this.lastUpdate < this.UPDATE_INTERVAL) {
      return;
    }
    
    // Advance time
    this.timeOfDay += (deltaTime / 1000) / 3600; // Convert to hours
    if (this.timeOfDay >= 24) {
      this.timeOfDay -= 24;
      this.timeOfYear += 1/365;
      if (this.timeOfYear >= 1) {
        this.timeOfYear -= 1;
      }
    }
    
    // Update season if needed
    const newSeason = this.getCurrentSeasonConfig();
    if (newSeason.season !== this.currentSeason.season) {
      this.currentSeason = newSeason;
    }
    
    // Evolve weather based on forecast
    this.evolveWeather(deltaTime);
    
    // Update forecast
    this.updateForecast();
    
    // Store weather history
    this.weatherHistory.push({
      timestamp: currentTime,
      weather: { ...this.currentWeather }
    });
    
    // Limit history size
    if (this.weatherHistory.length > 288) { // 24 hours at 5-min intervals
      this.weatherHistory.shift();
    }
    
    this.lastUpdate = currentTime;
  }

  private evolveWeather(deltaTime: number): void {
    const newWeather = { ...this.currentWeather };
    
    // Temperature evolution
    newWeather.temperature = this.evolveTemperature();
    
    // Pressure changes (affects other weather)
    const pressureChange = (Math.random() - 0.5) * 0.5;
    newWeather.pressure += pressureChange;
    newWeather.pressure = Math.max(95, Math.min(105, newWeather.pressure));
    
    // Humidity evolution
    newWeather.humidity = this.evolveHumidity(newWeather.temperature, newWeather.pressure);
    
    // Wind evolution
    this.evolveWind(newWeather);
    
    // Cloud and precipitation evolution
    this.evolvePrecipitation(newWeather);
    
    // Update UV based on new conditions
    newWeather.uvIndex = this.calculateUVIndex();
    
    // Update visibility based on precipitation and humidity
    newWeather.visibility = this.calculateVisibility(newWeather);
    
    this.currentWeather = newWeather;
  }

  private evolveTemperature(): number {
    const idealTemp = this.generateTemperature();
    const currentTemp = this.currentWeather.temperature;
    
    // Temperature changes gradually toward ideal
    const tempChange = (idealTemp - currentTemp) * 0.1;
    const randomChange = (Math.random() - 0.5) * 0.5;
    
    return currentTemp + tempChange + randomChange;
  }

  private evolveHumidity(temperature: number, pressure: number): number {
    let humidity = this.currentWeather.humidity;
    
    // Humidity tends toward equilibrium based on temperature
    const equilibriumHumidity = 0.3 + this.climateZone.proximity_to_water * 0.4 + 
                               (25 - temperature) * 0.01; // Cooler air holds less moisture
    
    const humidityChange = (equilibriumHumidity - humidity) * 0.05;
    humidity += humidityChange;
    
    // Precipitation affects humidity
    if (this.currentWeather.precipitation > 0) {
      humidity += 0.02;
    }
    
    // Random variation
    humidity += (Math.random() - 0.5) * 0.05;
    
    return Math.max(0, Math.min(1, humidity));
  }

  private evolveWind(weather: WeatherState): void {
    // Wind speed tends to be related to pressure gradients
    const pressureFactor = Math.abs(weather.pressure - 101.325) * 0.5;
    const targetWindSpeed = pressureFactor + Math.random() * 5;
    
    // Wind speed changes gradually
    weather.windSpeed += (targetWindSpeed - weather.windSpeed) * 0.2;
    weather.windSpeed = Math.max(0, Math.min(20, weather.windSpeed));
    
    // Wind direction changes more slowly
    const directionChange = (Math.random() - 0.5) * 30;
    weather.windDirection += directionChange;
    if (weather.windDirection < 0) weather.windDirection += 360;
    if (weather.windDirection >= 360) weather.windDirection -= 360;
  }

  private evolvePrecipitation(weather: WeatherState): void {
    // Cloud formation based on humidity and temperature
    const cloudFormation = Math.max(0, (weather.humidity - 0.6) * 2);
    weather.cloudCover += (cloudFormation - weather.cloudCover) * 0.1;
    weather.cloudCover = Math.max(0, Math.min(1, weather.cloudCover));
    
    // Precipitation likelihood based on clouds and pressure
    const precipChance = weather.cloudCover * 0.8 + (102 - weather.pressure) * 0.1;
    
    if (Math.random() < precipChance * 0.1) {
      // Start precipitation
      weather.precipitation = Math.random() * 10;
    } else if (weather.precipitation > 0) {
      // Gradually reduce precipitation
      weather.precipitation *= 0.9;
      if (weather.precipitation < 0.1) {
        weather.precipitation = 0;
      }
    }
    
    // Heavy precipitation affects cloud cover
    if (weather.precipitation > 5) {
      weather.cloudCover = Math.max(weather.cloudCover, 0.8);
    }
  }

  private calculateVisibility(weather: WeatherState): number {
    let visibility = 10000; // Base visibility in meters
    
    // Precipitation reduces visibility
    if (weather.precipitation > 0) {
      visibility *= Math.max(0.1, 1 - weather.precipitation * 0.1);
    }
    
    // High humidity/fog reduces visibility
    if (weather.humidity > 0.9) {
      visibility *= Math.max(0.2, 2 - weather.humidity);
    }
    
    // Clouds at ground level (fog) reduce visibility
    if (weather.cloudCover > 0.8 && weather.humidity > 0.85) {
      visibility *= 0.5;
    }
    
    return Math.max(50, visibility);
  }

  private generateForecast(): void {
    this.forecast = [];
    const currentTime = Date.now();
    
    for (let hour = 1; hour <= this.FORECAST_HOURS; hour++) {
      const forecastTime = currentTime + hour * 3600000; // Hour in milliseconds
      const forecastWeather = this.predictWeatherAt(hour);
      
      this.forecast.push({
        timestamp: forecastTime,
        duration: 3600000, // 1 hour
        weather: forecastWeather,
        probability: Math.max(0.3, 1 - hour * 0.03), // Confidence decreases with time
      });
    }
  }

  private updateForecast(): void {
    // Remove outdated forecasts
    const currentTime = Date.now();
    this.forecast = this.forecast.filter(f => f.timestamp > currentTime);
    
    // Add new forecasts if needed
    while (this.forecast.length < this.FORECAST_HOURS) {
      const lastForecast = this.forecast[this.forecast.length - 1];
      const nextTime = lastForecast ? lastForecast.timestamp + 3600000 : currentTime + 3600000;
      const hoursAhead = this.forecast.length + 1;
      
      this.forecast.push({
        timestamp: nextTime,
        duration: 3600000,
        weather: this.predictWeatherAt(hoursAhead),
        probability: Math.max(0.3, 1 - hoursAhead * 0.03),
      });
    }
  }

  private predictWeatherAt(hoursAhead: number): WeatherState {
    // Simple weather prediction based on current trends
    const persistence = Math.pow(this.WEATHER_PERSISTENCE, hoursAhead);
    const change = 1 - persistence;
    
    const currentWeather = this.currentWeather;
    const idealWeather = this.generateIdealWeatherForTime(hoursAhead);
    
    return {
      temperature: currentWeather.temperature * persistence + idealWeather.temperature * change,
      humidity: currentWeather.humidity * persistence + idealWeather.humidity * change,
      pressure: currentWeather.pressure * persistence + idealWeather.pressure * change,
      windSpeed: currentWeather.windSpeed * persistence + idealWeather.windSpeed * change,
      windDirection: this.interpolateAngle(currentWeather.windDirection, idealWeather.windDirection, change),
      precipitation: currentWeather.precipitation * persistence + idealWeather.precipitation * change,
      cloudCover: currentWeather.cloudCover * persistence + idealWeather.cloudCover * change,
      visibility: currentWeather.visibility * persistence + idealWeather.visibility * change,
      uvIndex: this.calculateUVIndexForTime(hoursAhead),
    };
  }

  private generateIdealWeatherForTime(hoursAhead: number): WeatherState {
    const futureTimeOfDay = (this.timeOfDay + hoursAhead) % 24;
    const savedTimeOfDay = this.timeOfDay;
    
    // Temporarily change time to generate ideal weather
    this.timeOfDay = futureTimeOfDay;
    const idealWeather = this.generateInitialWeather();
    this.timeOfDay = savedTimeOfDay;
    
    return idealWeather;
  }

  private calculateUVIndexForTime(hoursAhead: number): number {
    const futureTimeOfDay = (this.timeOfDay + hoursAhead) % 24;
    const savedTimeOfDay = this.timeOfDay;
    
    this.timeOfDay = futureTimeOfDay;
    const uvIndex = this.calculateUVIndex();
    this.timeOfDay = savedTimeOfDay;
    
    return uvIndex;
  }

  private interpolateAngle(angle1: number, angle2: number, t: number): number {
    // Handle angle wrapping for smooth interpolation
    let diff = angle2 - angle1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    let result = angle1 + diff * t;
    if (result < 0) result += 360;
    if (result >= 360) result -= 360;
    
    return result;
  }

  /**
   * Get current weather state
   */
  public getCurrentWeather(): WeatherState {
    return { ...this.currentWeather };
  }

  /**
   * Get weather forecast
   */
  public getForecast(hours: number = 24): WeatherForecast[] {
    return this.forecast.slice(0, hours).map(f => ({ ...f, weather: { ...f.weather } }));
  }

  /**
   * Get weather at specific time
   */
  public getWeatherAt(timestamp: number): WeatherState | null {
    const forecast = this.forecast.find(f => 
      timestamp >= f.timestamp && timestamp < f.timestamp + f.duration);
    
    return forecast ? { ...forecast.weather } : null;
  }

  /**
   * Check if it's currently daytime
   */
  public isDaytime(): boolean {
    const sunrise = 6;
    const sunset = 6 + this.currentSeason.dayLength;
    return this.timeOfDay >= sunrise && this.timeOfDay <= sunset;
  }

  /**
   * Get time information
   */
  public getTimeInfo(): {
    timeOfDay: number;
    timeOfYear: number;
    season: string;
    dayLength: number;
    isDaytime: boolean;
  } {
    return {
      timeOfDay: this.timeOfDay,
      timeOfYear: this.timeOfYear,
      season: this.currentSeason.season,
      dayLength: this.currentSeason.dayLength,
      isDaytime: this.isDaytime(),
    };
  }

  /**
   * Get weather history
   */
  public getWeatherHistory(hours: number = 24): Array<{timestamp: number, weather: WeatherState}> {
    const cutoffTime = Date.now() - hours * 3600000;
    return this.weatherHistory.filter(entry => entry.timestamp >= cutoffTime);
  }

  /**
   * Set climate zone
   */
  public setClimateZone(climateZone: ClimateZone): void {
    this.climateZone = climateZone;
    this.currentSeason = this.getCurrentSeasonConfig();
  }

  /**
   * Force weather change (for testing or special events)
   */
  public setWeather(weather: Partial<WeatherState>): void {
    Object.assign(this.currentWeather, weather);
  }

  /**
   * Get weather statistics
   */
  public getWeatherStats(): {
    avgTemperature: number;
    avgHumidity: number;
    avgPressure: number;
    totalPrecipitation: number;
    maxWindSpeed: number;
  } {
    if (this.weatherHistory.length === 0) {
      return {
        avgTemperature: this.currentWeather.temperature,
        avgHumidity: this.currentWeather.humidity,
        avgPressure: this.currentWeather.pressure,
        totalPrecipitation: 0,
        maxWindSpeed: this.currentWeather.windSpeed,
      };
    }
    
    const stats = this.weatherHistory.reduce((acc, entry) => {
      acc.temperature += entry.weather.temperature;
      acc.humidity += entry.weather.humidity;
      acc.pressure += entry.weather.pressure;
      acc.precipitation += entry.weather.precipitation;
      acc.maxWind = Math.max(acc.maxWind, entry.weather.windSpeed);
      return acc;
    }, { temperature: 0, humidity: 0, pressure: 0, precipitation: 0, maxWind: 0 });
    
    const count = this.weatherHistory.length;
    
    return {
      avgTemperature: stats.temperature / count,
      avgHumidity: stats.humidity / count,
      avgPressure: stats.pressure / count,
      totalPrecipitation: stats.precipitation,
      maxWindSpeed: stats.maxWind,
    };
  }
}
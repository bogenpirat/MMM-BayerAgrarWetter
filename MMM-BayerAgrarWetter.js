/* Magic Mirror
 * Module: MMM-BayerAgrarWetter
 *
 * By bog
 *
 */
Module.register("MMM-BayerAgrarWetter", {
	
	defaults: {
		useHeader: true,
		header: "",
		zip: 10117,
		country: "DE",
		width: "400px",
		daysTrend: 4,
		updateIntervalMins: 5,
	},
	
	weatherData: {},
	
	getStyles: function() {
		return ["MMM-BayerAgrarWetter.css"];
	},
	
	getScripts: function() {
		return [];
	},
	
	requiresVersion: '2.2.0',
	
	start: function() {
		var self = this;
		var payload = this.config;
		setInterval(function() {
			self.sendSocketNotification("BAYERAGRARWETTER_REFRESH", payload); // no speed defined, so it updates instantly.
		}, this.config.updateIntervalMins * 60 * 1000);
		self.sendSocketNotification("BAYERAGRARWETTER_REFRESH", payload);
	},
	
	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.classList.add("small");
		
		if(Object.keys(this.weatherData).length > 0) {
			var currentWrapper = document.createElement("div");
			currentWrapper.classList.add("weather");
			currentWrapper.insertAdjacentHTML("beforeend", '<span class="logo-container"><img src="' + this.weatherData.symbolUrls.conditions.replace('{}', this.weatherData.dailies[0].Forecast[0].WeatherSymbol.Icon.replace(/[öüäß]/, '')) + '" class="blacknwhite currentTempIcon" /> <span class="currentTemp">' + this.weatherData.currConditions.Temperature + '&deg;C</span></span>');
			currentWrapper.insertAdjacentHTML("beforeend", '<br />');
			currentWrapper.insertAdjacentHTML("beforeend", this.weatherData.dailies[0].Forecast[0].WeatherSymbol.Description);
			currentWrapper.insertAdjacentHTML("beforeend", '<br />');
			currentWrapper.insertAdjacentHTML("beforeend", '<img src="' + this.weatherData.symbolUrls.wind.replace('{}', this.weatherData.dailies[0].Forecast[0].Wind.WindDirection.Direction) + '" class="blacknwhite legend-logo" /> ' + this.weatherData.dailies[0].Forecast[0].Wind.WindSpeed + 'km/h');
			
			wrapper.appendChild(currentWrapper);
			
			if(parseInt(this.config.daysTrend) > 0) {
				wrapper.insertAdjacentHTML("beforeend", '<br />');
				
				var ft = document.createElement("table");
				
				var headerHtml = '<tr>';
				for(var i = 0; i < this.weatherData.dailies.length && i < this.config.daysTrend; i++) {
					let dayLabel = new Date(this.weatherData.dailies[i].Date).toLocaleString(navigator.languages[0], {  weekday: 'short' });
					headerHtml += '<th class="trendcell">' + dayLabel + '</th>';
				}
				ft.insertAdjacentHTML("beforeend", headerHtml + '</tr>');
				
				var dailyEntriesHtml = '<tr>';
				for(var i = 0; i < this.weatherData.dailies.length && i < this.config.daysTrend; i++) {
					dailyEntriesHtml += '<td class="trendcell">';
					dailyEntriesHtml += '<img src="' + this.weatherData.symbolUrls.conditions.replace('{}', this.weatherData.dailies[i].AllDay.WeatherSymbol.Icon.replace(/[öüäß]/, '')) + '" class="blacknwhite" width="32" />';
					dailyEntriesHtml += '<br />';
					dailyEntriesHtml += '<span class="temp-' + this.weatherData.dailies[i].AllDay.TempMax + ' logo-container"><img class="legend-logo inverted" src="' + this.file('assets/high-temperature.svg') + '" /> ' + this.weatherData.dailies[i].AllDay.TempMax + '</span>';
					dailyEntriesHtml += '<br />';
					dailyEntriesHtml += '<span class="temp-' + this.weatherData.dailies[i].AllDay.TempMin + ' logo-container"><img class="legend-logo inverted" src="' + this.file('assets/low-temperature.svg') + '" />' + this.weatherData.dailies[i].AllDay.TempMin + '</span>';
					dailyEntriesHtml += '<br />';
					dailyEntriesHtml += '<span class="precipitation logo-container"><img class="legend-logo" src="' + this.weatherData.symbolUrls.precipitation + '" /> ' + this.weatherData.dailies[i].AllDay.Precipitation.PoP +'%</span>';
					dailyEntriesHtml += '</td>';
				}
				ft.insertAdjacentHTML("beforeend", dailyEntriesHtml + '</tr>');
				
				wrapper.appendChild(ft);
			}
		}
		
		return wrapper;
	},
	
	socketNotificationReceived: function(notification, payload) {
		if(notification  == "BAYERAGRARWETTER_RESULTS") {
			this.weatherData = payload;
			this.updateDom();
		}
	}
});
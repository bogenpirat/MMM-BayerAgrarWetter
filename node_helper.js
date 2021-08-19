const rp = require('request-promise');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
	
	socketNotificationReceived: function(notification, payload) {
		if(notification  == "BAYERAGRARWETTER_REFRESH") {
			this.updateBAWTrend(payload);
		}
	},

	
	updateBAWTrend: async function(cfg) {
		// LOCATION
		const loc = await this.getLocation(cfg.zip, cfg.country);

		// CURRENT CONDITIONS
		let currConditions = await this.getCurrentConditions(loc['Latitude'], loc['Longitude']);
		
		// HOURLY FORECAST
		let hourlies = await this.getHourlyForecast(loc['Latitude'], loc['Longitude']);
	
		// DAILY FORECAST
		let dailies = await this.get6DaysForecast(loc);
		
		// SIGNAL DATA
		const notif = {
			currConditions: currConditions,
			hourlies: hourlies,
			dailies: dailies,
			symbolUrls: {
				wind: 'https://agrar.bayer.de/-/media/BCSD/Resources/Layout/Wetter/Windrichtungen/{}.ashx',
				conditions: 'https://agrar.bayer.de/-/media/BCSD/Resources/Layout/Wetter/{}.ashx',
				precipitation: 'https://agrar.bayer.de/-/media/BCSD/Resources/Layout/Wetter/i_niederschlagsmenge.ashx',
				lowTemp: 'https://agrar.bayer.de/-/media/BCSD/Resources/Layout/Wetter/pfeil_min_blau.ashx',
				highTemp: 'https://agrar.bayer.de/-/media/BCSD/Resources/Layout/Wetter/pfeil_max_blau.ashx',
				sun: 'https://agrar.bayer.de/-/media/BCSD/Resources/Layout/Wetter/sonnenscheindauer.ashx',
			}
		};
		this.sendSocketNotification("BAYERAGRARWETTER_RESULTS", notif);
	},
	
	makeOpts: function(myUrl, userAgent) {
		return {
			host: myUrl.hostname,
			path: myUrl.path,
			port: 443,
			timeout: 5000,
			method: 'GET'
		};
	},

	storeData: function(fname, data) {
		require('fs').writeFileSync(fname, data, function(err) {
				if(err) {
					console.log(err);
				}
		});
	},

	getLocation: async function(zip, country) {
		const opts = {
			uri: new URL('https://agrar.bayer.de/api/WeatherV3/GeoSearch/' + zip),
			transform: function(body) {
				return JSON.parse(body);
			},
			method: 'GET',
		};
		let jsonData = await rp(opts);
		
		for(let i = 0; i < jsonData.length; i++) {
			let countryResults = jsonData[i]['Results'];
			for(let j = 0; j < countryResults.length; j++) {
				let zipResults = countryResults[j];
				if(country == zipResults['CountryCode']) {
					return zipResults;
				}
			}
		}
	
		return null;
	},
	
	getCurrentConditions: async function(latitude, longitude) {
		const opts = {
			uri: new URL(`https://agrar.bayer.de/api/WeatherV3/WeatherStations?lat=${latitude}&lng=${longitude}`),
			transform: function(body) {
				return JSON.parse(body);
			},
			method: 'GET',
		};
	
		let jsonData = await rp(opts);
	
		return jsonData[0];
	},
	
	get6DaysForecast: async function(location) {
		const query = `lat=${location.Latitude}&lon=${location.Longitude}&name=${location.Name}&adminName=${location.AdminName}&countryCode=${location.CountryCode}`;
		const opts = {
			uri: new URL('https://agrar.bayer.de/api/WeatherV3/Get6DaysForecast?' + query),
			transform: function(body) {
				return JSON.parse(body);
			},
			method: 'GET',
		};
	
		let jsonData = await rp(opts);
	
		return jsonData['Days'];
	},
	
	getHourlyForecast: async function(latitude, longitude) {
		const opts = {
			uri: new URL(`https://agrar.bayer.de/api/WeatherV3/XlForecast?lat=${latitude}&lon=${longitude}`),
			transform: function(body) {
				return JSON.parse(body);
			},
			method: 'GET',
		};
	
		let jsonData = await rp(opts);
	
		return jsonData[0];
	},
});
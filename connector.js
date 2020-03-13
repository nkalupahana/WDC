/* global tableau reqwest */

(function() {
    // Dark Sky API Key
    let API_KEY = "c5a50d083981d1ecad8c5b22c76d2762";
    // Location of forecast (currently KHIO)
    let LOCATIONS = [
        {
            locationName: "KHIO",
            lat: 45.535122,
            lng: -122.948361
        },
        {
            locationName: "Civic Center",
            lat: 45.522203,
            lng: -122.989419
        }
    ];
    
    /* Schema for data to get from Dark Sky JSON */
    // id: attribute in Dark Sky JSON
    // alias: name of data value in Tableau table
    // dataType: Data type of value (see all at https://tableau.github.io/webdataconnector/docs/api_ref.html#webdataconnectorapi.datatypeenum)
    let colsHourly = [{
            id: "time",
            alias: "Date",
            dataType: tableau.dataTypeEnum.datetime
        }, {
            id: "locationName",
            alias: "Location",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "lat",
            alias: "Latitude",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "lng",
            alias: "Longitude",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "summary",
            alias: "Summary",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "precipProbability",
            alias: "Precipitation Probability",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "precipIntensity",
            alias: "Precipitation Intensity",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "precipType",
            alias: "Precipitation Type",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "temperature",
            alias: "Temperature",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "apparentTemperature",
            alias: "Apparent Temperature",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "dewPoint",
            alias: "Dew Point",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "humidity",
            alias: "Humidity",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "pressure",
            alias: "Pressure",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "windSpeed",
            alias: "Wind Speed",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "windGust",
            alias: "Wind Gust",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "windBearing",
            alias: "Wind Bearing",
            dataType: tableau.dataTypeEnum.int
        }, {
            id: "cloudCover",
            alias: "Cloud Cover",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "uvIndex",
            alias: "UV Index",
            dataType: tableau.dataTypeEnum.int
        }, {
            id: "visibility",
            alias: "Visibility",
            dataType: tableau.dataTypeEnum.int
        }];

    let colsDaily = colsHourly.filter(o => {
        return o.id !== 'temperature' && o.id !== 'apparentTemperature' && o.id !== 'time';
    });

    let addToDaily = [
        {
            id: "time",
            alias: "Date",
            dataType: tableau.dataTypeEnum.date
        },
        {
            id: "temperatureHigh",
            alias: "High Temperature",
            dataType: tableau.dataTypeEnum.float
        },
        {
            id: "temperatureLow",
            alias: "Low Temperature",
            dataType: tableau.dataTypeEnum.float
        },
        {
            id: "apparentTemperatureHigh",
            alias: "Apparent High Temperature",
            dataType: tableau.dataTypeEnum.float
        },
        {
            id: "apparentTemperatureLow",
            alias: "Apparent Low Temperature",
            dataType: tableau.dataTypeEnum.float
        },
    ];

    colsDaily = [...addToDaily, ...colsDaily];
    
    // Create the connector object
    let connector = tableau.makeConnector();

    // Define schema
    connector.getSchema = surfaceSchema => {
        /* Create schema with columns & some other attributes */
        // alias: Name of Data Source in Tableau
        let hourlySchema = {
            id: "darkskyHourly",
            alias: "Weather - Hourly",
            columns: colsHourly
        };

        let dailySchema = {
            id: "darkskyDaily",
            alias: "Weather - Daily",
            columns: colsDaily
        };

        // Surface schema to Tableau
        surfaceSchema([hourlySchema, dailySchema]);
    };

    // Download and format data
    connector.getData = async (table, done) => {
        let requests = [];

        let cols;
        let tableId;
        if (table.tableInfo.id == "darkskyHourly") {
            cols = colsHourly;
            tableId = "hourly";
        } else {
            cols = colsDaily;
            tableId = "daily";
        }

        for (let loc of LOCATIONS) {
            // Get data (gets 7-day hourly forcast (extended); excludes all other data)
            // Format: JSON-P (circumvents Cross-Origin exceptions)
            requests.push(new Promise((resolve, _reject) => {
                let url;

                if (tableId == "hourly") {
                    url = `https://api.darksky.net/forecast/${API_KEY}/${String(loc.lat)},${String(loc.lng)}?extend=hourly&exclude=currently,minutely,daily,alerts,flags`;
                } else {
                    url = `https://api.darksky.net/forecast/${API_KEY}/${String(loc.lat)},${String(loc.lng)}?exclude=currently,minutely,hourly,alerts,flags`;
                }

                reqwest({
                    url,
                    type: "jsonp",
                    success: resp => {
                        // Full table data storage
                        let tableData = [];

                        // Format hourly data as necessary
                        for (let item of resp[tableId]["data"]) {
                            let obj = {};

                            item = {...item, ...loc};
                            
                            // Cycle through data and pick out pieces in schema
                            for (let attributeToAdd of cols) {
                                if (attributeToAdd.id == "time") {
                                    // Create formatted DateTime object for Tableau
                                    let tobj = new Date(item[attributeToAdd.id] * 1000);

                                    if (tableId == "hourly") {
                                        obj[attributeToAdd.id] = tobj.toLocaleDateString() + " " + tobj.toLocaleTimeString();
                                    } else {
                                        obj[attributeToAdd.id] = tobj.toLocaleDateString();
                                    }
                                } else {
                                    // Move the attribute over
                                    obj[attributeToAdd.id] = item[attributeToAdd.id];
                                }
                            }
    
                            // Save the formatted data object
                            tableData.push(obj);
                        }
                        
                        // Send data to Tableau and mark as complete
                        table.appendRows(tableData);
                        resolve();
                    }
                });
            }));
        }

        await Promise.all(requests);
        done();
    };

    // Surface connector to tableau library
    tableau.registerConnector(connector);
    
    // Run ready() when everything is loaded
    if (document.readyState != 'loading') {
        ready();
    } else {
        document.addEventListener('DOMContentLoaded', ready);
    }


    // Create event listener for when user requests data
    function ready() {
        document.getElementById("submitButton").addEventListener("click", () => {
            // Set data source name
            tableau.connectionName = "Dark Sky Connector";
            // Submit connector to Tableau
            tableau.submit();
        });
    }
    
})();
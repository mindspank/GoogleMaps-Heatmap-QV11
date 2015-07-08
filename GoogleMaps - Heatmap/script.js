//Google Maps APIv3 Heatmaps
//Created by Alexander Karlsson - akl@qlikview.com - QlikTech Nordic AB
//Tested on QV11
//
//QlikTech takes no responsbility for any code.
//Use at your own risk.
//Do not submerge in water.
//Do not taunt Happy Fun Ball.

 	
function map_init() {

    var TILE_SIZE = 256;
    var map;
    var circles;
    circles = [];
	var desiredRadiusPerPointInMeters = 200;
	var vPointSize = 1;
	var vPointFillColor = "#000000";
	var ZoomLeveltoShowPoint = 11;

	infowindow = new google.maps.InfoWindow();
	 
	//Mercator --BEGIN--
	function bound(value, opt_min, opt_max) {
		if (opt_min !== null) value = Math.max(value, opt_min);
		if (opt_max !== null) value = Math.min(value, opt_max);
		return value;
	}

	function degreesToRadians(deg) {
		return deg * (Math.PI / 180);
	}

	function radiansToDegrees(rad) {
		return rad / (Math.PI / 180);
	}

	function MercatorProjection() {
		this.pixelOrigin_ = new google.maps.Point(TILE_SIZE / 2,
			TILE_SIZE / 2);
		this.pixelsPerLonDegree_ = TILE_SIZE / 360;
		this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);
	}

	MercatorProjection.prototype.fromLatLngToPoint = function (latLng,
		opt_point) {
		var me = this;
		var point = opt_point || new google.maps.Point(0, 0);
		var origin = me.pixelOrigin_;

		point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;

		// NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
		// 89.189.  This is about a third of a tile past the edge of the world
		// tile.
		var siny = bound(Math.sin(degreesToRadians(latLng.lat())), - 0.9999,
			0.9999);
		point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
		return point;
	}

	MercatorProjection.prototype.fromPointToLatLng = function (point) {
		var me = this;
		var origin = me.pixelOrigin_;
		var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
		var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
		var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
		return new google.maps.LatLng(lat, lng);
	}

	//Mercator --END--
	  
	function getNewRadius() {
		var numTiles = 1 << map.getZoom();
		var center = map.getCenter();
		var moved = google.maps.geometry.spherical.computeOffset(center, 1000, 90); /*1000 meters to the right*/
		var projection = new MercatorProjection();
		var initCoord = projection.fromLatLngToPoint(center);
		var endCoord = projection.fromLatLngToPoint(moved);
		var initPoint = new google.maps.Point(
            initCoord.x * numTiles,
            initCoord.y * numTiles);
		var endPoint = new google.maps.Point(
            endCoord.x * numTiles,
            endCoord.y * numTiles);
		var pixelsPerMeter = (Math.abs(initPoint.x - endPoint.x)) / 1000.0;
		var totalPixelSize = (Math.floor(desiredRadiusPerPointInMeters * pixelsPerMeter)) + 5;
        return totalPixelSize;
	}


	Qva.AddExtension("GoogleMaps - Heatmap", function () {

		var _this = this;

		if (this.Layout.Text0.text != '' && this.Layout.Text0.text != NaN) { desiredRadiusPerPointInMeters = this.Layout.Text0.text };
		if (this.Layout.Text1.text != '' && this.Layout.Text1.text != NaN) { ZoomLeveltoShowPoint = this.Layout.Text1.text };
		if (this.Layout.Text2.text != '' && this.Layout.Text2.text != NaN) { vPointSize = this.Layout.Text2.text };
		if (this.Layout.Text3.text != '' && this.Layout.Text3.text != NaN) { vPointFillColor = this.Layout.Text3.text };


		function ShowCircles() {

			//clear and initialize circles array
			for (var i = 0, k = circles.length; i < k; i++) {
				circles[i].setMap(null);
			}
			circles = [];
			//------
			var zoomlevel = map.getZoom();

			if (zoomlevel >= ZoomLeveltoShowPoint) {
				// Get the center lat/lng of the map
				var center = map.getCenter();
				
				// Get the size of the map viewport
				var bounds = map.getBounds();
				if (bounds != null) {
					var cor1 = bounds.getNorthEast();
					var cor2 = bounds.getSouthWest();
					var cor3 = new google.maps.LatLng(cor2.lat(), cor1.lng());
					var cor4 = new google.maps.LatLng(cor1.lat(), cor2.lng());
					var width = google.maps.geometry.spherical.computeDistanceBetween(cor1, cor3);
					var height = google.maps.geometry.spherical.computeDistanceBetween(cor1, cor4);

					// Loop through your markers
					for (var i = 0, k = _this.Data.Rows.length; i < k; i++) {
						// Get the distance between the center of the map and your markers
						var row = _this.Data.Rows[i];
						var val = parseFloat(row[0].text);
						var val2 = parseFloat(row[1].text);

						if (val != NaN && val != '' && val <= 90 && val >= -90 && val2 != NaN && val2 != '' && val2 <= 180 && val >= -180) {
							var latLng = new google.maps.LatLng(row[0].text, row[1].text);
							var distanceFromMarker = google.maps.geometry.spherical.computeDistanceBetween(center, latLng);

							if (distanceFromMarker <= width || distanceFromMarker <= height) {
								var circle = new google.maps.Circle({
									radius: vPointSize,
									fillColor: vPointFillColor,
									fillOpacity: 0.4,
									strokeColor: vPointFillColor,
									strokeOpacity: 0.8,
									strokeWeight: 2,
									center: latLng,
									text: row[3].text
								});
								circles.push(circle);
								google.maps.event.addListener(circle, 'mouseover', function () {
									if (infowindow.getPosition() !== this.getCenter() || infowindowClosed === true) {
										infowindow.setContent(this.text);
										infowindow.setPosition(this.getCenter());
										infowindow.open(map);
										infowindowClosed = false;
									}
								});
							}
						}
					}
					//set circles on map
					for (var i = 0, k = circles.length; i < k; i++) {
						circles[i].setMap(map);
					};
				}
			}

		}
		
		var gradient = ['rgba(0,0,0,0)',
			'rgb(0,109,44)',
			'rgb(49,163,84)',
			'rgb(116,196,118)',
			'rgb(186,228,179)',
			'rgb(254,224,144)',
			'rgb(253,174,97)',
			'rgb(244,109,67)',
			'rgb(215,48,39)'
		];


		var divName = _this.Layout.ObjectId.replace("\\", "_");

		if (_this.Element.children.length == 0) {
			var ui = document.createElement("div");
			ui.setAttribute("id", divName);
			_this.Element.appendChild(ui);
			$("#" + divName).css("height", _this.GetHeight() + "px").css("width", _this.GetWidth() + "px");
		} else {
			$("#" + divName).css("height", _this.GetHeight() + "px").css("width", _this.GetWidth() + "px");
			$("#" + divName).empty();
		};

		if (_this.Data.Rows.length > 0) {

			var latlngbounds = new google.maps.LatLngBounds();
			map = new google.maps.Map(document.getElementById(divName), {
				mapTypeId: google.maps.MapTypeId.ROADMAP
			});

			var markers = [];

			for (var i = 0, k = _this.Data.Rows.length; i < k; i++) {

				var row = _this.Data.Rows[i];
				var val = parseFloat(row[0].text);
				var val2 = parseFloat(row[1].text);
				if (val != NaN && val != '' && val <= 90 && val >= -90 && val2 != NaN && val2 != '' && val2 <= 180 && val >= -180) {
					var latLng = new google.maps.LatLng(row[0].text, row[1].text);
					latlngbounds.extend(latLng);
					markers[i] = {
						location: latLng,
						weight: parseFloat(row[2].text)
					};

				};
			};


			map.setCenter(latlngbounds.getCenter());
			map.fitBounds(latlngbounds);

			var heatmap = new google.maps.visualization.HeatmapLayer({
				data: markers,
				radius: getNewRadius(),
				opacity: 0.7
			});
			heatmap.set('gradient', gradient);

			heatmap.setMap(map);
			google.maps.event.addListener(map, 'zoom_changed', function () {
				heatmap.setOptions({ radius: getNewRadius() });
			});
			google.maps.event.addListener(map, 'dragend', ShowCircles);
			google.maps.event.addListener(map, 'zoom_changed', ShowCircles);

		} else {
			document.getElementById(divName).innerHTML = "THERE IS NO DATA TO DISPLAY. " + _this.Data.Rows.length + " ROWS";
		};

	});
};

/* load external libs - callback map_init() */
loadLibs();
function loadLibs() {
	Qva.LoadScript("https://maps.googleapis.com/maps/api/js?sensor=false&libraries=visualization,geometry&callback=map_init");
};
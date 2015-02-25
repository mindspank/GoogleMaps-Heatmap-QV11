//Google Maps APIv3 Heatmaps
//Created by Alexander Karlsson - akl@qlikview.com - QlikTech Nordic AB
//Tested on QV11
//
//QlikTech takes no responsbility for any code.
//Use at your own risk.
//Do not submerge in water.
//Do not taunt Happy Fun Ball.

function map_init() {
	Qva.AddExtension("GoogleMaps - Heatmap", function() {

		var divName = this.Layout.ObjectId.replace("\\", "_");

		if (this.Element.children.length == 0) {
			$('<div/>', {
				id: divName,
				width: this.GetWidth(),
				height: this.GetHeight()
			}).appendTo(this.Element)
		} else {
			$('#' + divName).css({
				width: this.GetWidth(),
				height: this.GetHeight()
			}).empty();
		};


		var map = new google.maps.Map(document.getElementById(divName), {
			mapTypeId: google.maps.MapTypeId.ROADMAP
		});
		var latlngbounds = new google.maps.LatLngBounds();
		var markers = [];

		for (var i = 0, k = this.Data.Rows.length; i < k; i++) {

			var row = this.Data.Rows[i];
			var val = parseFloat(row[0].text);
			var val2 = parseFloat(row[1].text);

			if (val != NaN && val != '' && val <= 90 && val >= -90 && val2 != NaN && val2 != '' && val2 <= 180 && val >= -180) {
				var latLng = new google.maps.LatLng(row[0].text, row[1].text);
				latlngbounds.extend(latLng);
				markers.push({
					location: latLng,
					weight: parseFloat(row[2].text)
				});
			};
		};

		var heatmap = new google.maps.visualization.HeatmapLayer({
			data: markers
		});

		heatmap.setMap(map);
		map.setCenter(latlngbounds.getCenter());
		map.fitBounds(latlngbounds);
	});
};

/* load external libs - callback map_init() */
loadLibs();

function loadLibs() {
	Qva.LoadScript('https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=visualization&callback=map_init')
};
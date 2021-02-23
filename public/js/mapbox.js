/*eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicmV6emNvIiwiYSI6ImNra3Z2OG5sZDA2NXEydW9ldnQzM3RidDQifQ.MZD8CfEy9AEelTSjcpSqFw';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/rezzco/ckkw9mun00dwd17o4juompc3e',
    scrollZoom: false
    //   center: [-118.263454, 34.023007],
    //   zoom: 7,
    //   interactive: false
  });

  // we want to bound our map to areas around our tour locations
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create a marker
    const el = document.createElement('div');
    el.className = 'marker';

    //   add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // create pop up
    new mapboxgl.Popup({ offset: 20 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extend the map bounds to include new locations
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100
    }
  });
};

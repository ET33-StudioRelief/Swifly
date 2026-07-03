import markerSDK from '@marker.io/browser';

export async function launchMarkerSDK() {
  const widget = await markerSDK.loadWidget({
    project: '6a38fcc183c0441a973c6842',
  });
  return widget;
}

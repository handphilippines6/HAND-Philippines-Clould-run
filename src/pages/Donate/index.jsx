import Home from '../Home/index.jsx';

/**
 * /donate — donation is a dialog now (model1 routeModals): the route renders
 * Home and opens the giving dialog on arrival, so a deep link, a refresh, or a
 * nav item lands on the form itself while the page still renders underneath.
 */
export default function Donate() {
  return <Home autoDonate />;
}

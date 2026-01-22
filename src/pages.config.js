import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import FactFindWelcome from './pages/FactFindWelcome';
import FactFindAboutYou from './pages/FactFindAboutYou';
import FactFindHousehold from './pages/FactFindHousehold';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "AdminDashboard": AdminDashboard,
    "FactFindWelcome": FactFindWelcome,
    "FactFindAboutYou": FactFindAboutYou,
    "FactFindHousehold": FactFindHousehold,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
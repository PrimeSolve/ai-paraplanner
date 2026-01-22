import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import FactFindWelcome from './pages/FactFindWelcome';
import FactFindAboutYou from './pages/FactFindAboutYou';
import FactFindPersonal from './pages/FactFindPersonal';
import FactFindPrefill from './pages/FactFindPrefill';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "AdminDashboard": AdminDashboard,
    "FactFindWelcome": FactFindWelcome,
    "FactFindAboutYou": FactFindAboutYou,
    "FactFindPersonal": FactFindPersonal,
    "FactFindPrefill": FactFindPrefill,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
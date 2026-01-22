import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import FactFindWelcome from './pages/FactFindWelcome';
import FactFindAboutYou from './pages/FactFindAboutYou';
import FactFindPersonal from './pages/FactFindPersonal';
import FactFindPrefill from './pages/FactFindPrefill';
import FactFindDependants from './pages/FactFindDependants';
import FactFindTrusts from './pages/FactFindTrusts';
import FactFindSMSF from './pages/FactFindSMSF';
import FactFindSuperannuation from './pages/FactFindSuperannuation';
import FactFindInvestment from './pages/FactFindInvestment';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "AdminDashboard": AdminDashboard,
    "FactFindWelcome": FactFindWelcome,
    "FactFindAboutYou": FactFindAboutYou,
    "FactFindPersonal": FactFindPersonal,
    "FactFindPrefill": FactFindPrefill,
    "FactFindDependants": FactFindDependants,
    "FactFindTrusts": FactFindTrusts,
    "FactFindSMSF": FactFindSMSF,
    "FactFindSuperannuation": FactFindSuperannuation,
    "FactFindInvestment": FactFindInvestment,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
import AdminDashboard from './pages/AdminDashboard';
import FactFindAboutYou from './pages/FactFindAboutYou';
import FactFindAssetsLiabilities from './pages/FactFindAssetsLiabilities';
import FactFindDependants from './pages/FactFindDependants';
import FactFindIncomeExpenses from './pages/FactFindIncomeExpenses';
import FactFindInvestment from './pages/FactFindInvestment';
import FactFindPersonal from './pages/FactFindPersonal';
import FactFindPrefill from './pages/FactFindPrefill';
import FactFindSMSF from './pages/FactFindSMSF';
import FactFindSuperannuation from './pages/FactFindSuperannuation';
import FactFindTrusts from './pages/FactFindTrusts';
import FactFindWelcome from './pages/FactFindWelcome';
import Home from './pages/Home';
import FactFindInsurance from './pages/FactFindInsurance';
import FactFindSuperTax from './pages/FactFindSuperTax';
import FactFindAdviceReason from './pages/FactFindAdviceReason';
import FactFindRiskProfile from './pages/FactFindRiskProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "FactFindAboutYou": FactFindAboutYou,
    "FactFindAssetsLiabilities": FactFindAssetsLiabilities,
    "FactFindDependants": FactFindDependants,
    "FactFindIncomeExpenses": FactFindIncomeExpenses,
    "FactFindInvestment": FactFindInvestment,
    "FactFindPersonal": FactFindPersonal,
    "FactFindPrefill": FactFindPrefill,
    "FactFindSMSF": FactFindSMSF,
    "FactFindSuperannuation": FactFindSuperannuation,
    "FactFindTrusts": FactFindTrusts,
    "FactFindWelcome": FactFindWelcome,
    "Home": Home,
    "FactFindInsurance": FactFindInsurance,
    "FactFindSuperTax": FactFindSuperTax,
    "FactFindAdviceReason": FactFindAdviceReason,
    "FactFindRiskProfile": FactFindRiskProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
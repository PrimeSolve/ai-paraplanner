import AdminDashboard from './pages/AdminDashboard';
import FactFindAboutYou from './pages/FactFindAboutYou';
import FactFindAdviceReason from './pages/FactFindAdviceReason';
import FactFindAssetsLiabilities from './pages/FactFindAssetsLiabilities';
import FactFindAssistant from './pages/FactFindAssistant';
import FactFindDependants from './pages/FactFindDependants';
import FactFindIncomeExpenses from './pages/FactFindIncomeExpenses';
import FactFindInsurance from './pages/FactFindInsurance';
import FactFindInvestment from './pages/FactFindInvestment';
import FactFindPersonal from './pages/FactFindPersonal';
import FactFindPrefill from './pages/FactFindPrefill';
import FactFindReview from './pages/FactFindReview';
import FactFindRiskProfile from './pages/FactFindRiskProfile';
import FactFindSMSF from './pages/FactFindSMSF';
import FactFindSuperTax from './pages/FactFindSuperTax';
import FactFindSuperannuation from './pages/FactFindSuperannuation';
import FactFindTrusts from './pages/FactFindTrusts';
import FactFindWelcome from './pages/FactFindWelcome';
import Home from './pages/Home';
import SOAManagement from './pages/SOAManagement';
import SOARequestWelcome from './pages/SOARequestWelcome';
import SOARequestPrefill from './pages/SOARequestPrefill';
import SOARequestScope from './pages/SOARequestScope';
import SOARequestDetails from './pages/SOARequestDetails';
import SOARequestTransactions from './pages/SOARequestTransactions';
import SOARequestProducts from './pages/SOARequestProducts';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "FactFindAboutYou": FactFindAboutYou,
    "FactFindAdviceReason": FactFindAdviceReason,
    "FactFindAssetsLiabilities": FactFindAssetsLiabilities,
    "FactFindAssistant": FactFindAssistant,
    "FactFindDependants": FactFindDependants,
    "FactFindIncomeExpenses": FactFindIncomeExpenses,
    "FactFindInsurance": FactFindInsurance,
    "FactFindInvestment": FactFindInvestment,
    "FactFindPersonal": FactFindPersonal,
    "FactFindPrefill": FactFindPrefill,
    "FactFindReview": FactFindReview,
    "FactFindRiskProfile": FactFindRiskProfile,
    "FactFindSMSF": FactFindSMSF,
    "FactFindSuperTax": FactFindSuperTax,
    "FactFindSuperannuation": FactFindSuperannuation,
    "FactFindTrusts": FactFindTrusts,
    "FactFindWelcome": FactFindWelcome,
    "Home": Home,
    "SOAManagement": SOAManagement,
    "SOARequestWelcome": SOARequestWelcome,
    "SOARequestPrefill": SOARequestPrefill,
    "SOARequestScope": SOARequestScope,
    "SOARequestDetails": SOARequestDetails,
    "SOARequestTransactions": SOARequestTransactions,
    "SOARequestProducts": SOARequestProducts,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
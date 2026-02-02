/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAdviceGroupDetail from './pages/AdminAdviceGroupDetail';
import AdminAdviceGroups from './pages/AdminAdviceGroups';
import AdminAdvisers from './pages/AdminAdvisers';
import AdminClients from './pages/AdminClients';
import AdminCompleted from './pages/AdminCompleted';
import AdminDashboard from './pages/AdminDashboard';
import AdminHelp from './pages/AdminHelp';
import AdminProfile from './pages/AdminProfile';
import AdminQueue from './pages/AdminQueue';
import AdminSettings from './pages/AdminSettings';
import AdminTeam from './pages/AdminTeam';
import AdminTemplate from './pages/AdminTemplate';
import AdminTestSetup from './pages/AdminTestSetup';
import AdviceGroupAdvisers from './pages/AdviceGroupAdvisers';
import AdviceGroupClients from './pages/AdviceGroupClients';
import AdviceGroupCompleted from './pages/AdviceGroupCompleted';
import AdviceGroupDashboard from './pages/AdviceGroupDashboard';
import AdviceGroupHelp from './pages/AdviceGroupHelp';
import AdviceGroupModelPortfolios from './pages/AdviceGroupModelPortfolios';
import AdviceGroupMyProfile from './pages/AdviceGroupMyProfile';
import AdviceGroupProfile from './pages/AdviceGroupProfile';
import AdviceGroupRiskProfiles from './pages/AdviceGroupRiskProfiles';
import AdviceGroupSOARequests from './pages/AdviceGroupSOARequests';
import AdviceGroupSOATemplate from './pages/AdviceGroupSOATemplate';
import AdviceGroupSettings from './pages/AdviceGroupSettings';
import AdviserAnalytics from './pages/AdviserAnalytics';
import AdviserCalendar from './pages/AdviserCalendar';
import AdviserClientDetail from './pages/AdviserClientDetail';
import AdviserClients from './pages/AdviserClients';
import AdviserCompletions from './pages/AdviserCompletions';
import AdviserDashboard from './pages/AdviserDashboard';
import AdviserDocuments from './pages/AdviserDocuments';
import AdviserFactFinds from './pages/AdviserFactFinds';
import AdviserHelp from './pages/AdviserHelp';
import AdviserProfile from './pages/AdviserProfile';
import AdviserSOARequests from './pages/AdviserSOARequests';
import AdviserSOATemplate from './pages/AdviserSOATemplate';
import AdviserSettings from './pages/AdviserSettings';
import ClientDashboard from './pages/ClientDashboard';
import ClientDocuments from './pages/ClientDocuments';
import ClientHelp from './pages/ClientHelp';
import ClientMessages from './pages/ClientMessages';
import ClientProfile from './pages/ClientProfile';
import ClientSettings from './pages/ClientSettings';
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
import MyProfile from './pages/MyProfile';
import PublicAbout from './pages/PublicAbout';
import PublicContact from './pages/PublicContact';
import PublicHome from './pages/PublicHome';
import PublicPricing from './pages/PublicPricing';
import Register from './pages/Register';
import SOAManagement from './pages/SOAManagement';
import SOARequestAssumptions from './pages/SOARequestAssumptions';
import SOARequestDetails from './pages/SOARequestDetails';
import SOARequestInsurance from './pages/SOARequestInsurance';
import SOARequestPortfolio from './pages/SOARequestPortfolio';
import SOARequestPrefill from './pages/SOARequestPrefill';
import SOARequestProducts from './pages/SOARequestProducts';
import SOARequestReview from './pages/SOARequestReview';
import SOARequestScope from './pages/SOARequestScope';
import SOARequestStrategy from './pages/SOARequestStrategy';
import SOARequestTransactions from './pages/SOARequestTransactions';
import SOARequestWelcome from './pages/SOARequestWelcome';
import SignIn from './pages/SignIn';
import Whitepaper from './pages/Whitepaper';
import AdminTeamMemberProfile from './pages/AdminTeamMemberProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAdviceGroupDetail": AdminAdviceGroupDetail,
    "AdminAdviceGroups": AdminAdviceGroups,
    "AdminAdvisers": AdminAdvisers,
    "AdminClients": AdminClients,
    "AdminCompleted": AdminCompleted,
    "AdminDashboard": AdminDashboard,
    "AdminHelp": AdminHelp,
    "AdminProfile": AdminProfile,
    "AdminQueue": AdminQueue,
    "AdminSettings": AdminSettings,
    "AdminTeam": AdminTeam,
    "AdminTemplate": AdminTemplate,
    "AdminTestSetup": AdminTestSetup,
    "AdviceGroupAdvisers": AdviceGroupAdvisers,
    "AdviceGroupClients": AdviceGroupClients,
    "AdviceGroupCompleted": AdviceGroupCompleted,
    "AdviceGroupDashboard": AdviceGroupDashboard,
    "AdviceGroupHelp": AdviceGroupHelp,
    "AdviceGroupModelPortfolios": AdviceGroupModelPortfolios,
    "AdviceGroupMyProfile": AdviceGroupMyProfile,
    "AdviceGroupProfile": AdviceGroupProfile,
    "AdviceGroupRiskProfiles": AdviceGroupRiskProfiles,
    "AdviceGroupSOARequests": AdviceGroupSOARequests,
    "AdviceGroupSOATemplate": AdviceGroupSOATemplate,
    "AdviceGroupSettings": AdviceGroupSettings,
    "AdviserAnalytics": AdviserAnalytics,
    "AdviserCalendar": AdviserCalendar,
    "AdviserClientDetail": AdviserClientDetail,
    "AdviserClients": AdviserClients,
    "AdviserCompletions": AdviserCompletions,
    "AdviserDashboard": AdviserDashboard,
    "AdviserDocuments": AdviserDocuments,
    "AdviserFactFinds": AdviserFactFinds,
    "AdviserHelp": AdviserHelp,
    "AdviserProfile": AdviserProfile,
    "AdviserSOARequests": AdviserSOARequests,
    "AdviserSOATemplate": AdviserSOATemplate,
    "AdviserSettings": AdviserSettings,
    "ClientDashboard": ClientDashboard,
    "ClientDocuments": ClientDocuments,
    "ClientHelp": ClientHelp,
    "ClientMessages": ClientMessages,
    "ClientProfile": ClientProfile,
    "ClientSettings": ClientSettings,
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
    "MyProfile": MyProfile,
    "PublicAbout": PublicAbout,
    "PublicContact": PublicContact,
    "PublicHome": PublicHome,
    "PublicPricing": PublicPricing,
    "Register": Register,
    "SOAManagement": SOAManagement,
    "SOARequestAssumptions": SOARequestAssumptions,
    "SOARequestDetails": SOARequestDetails,
    "SOARequestInsurance": SOARequestInsurance,
    "SOARequestPortfolio": SOARequestPortfolio,
    "SOARequestPrefill": SOARequestPrefill,
    "SOARequestProducts": SOARequestProducts,
    "SOARequestReview": SOARequestReview,
    "SOARequestScope": SOARequestScope,
    "SOARequestStrategy": SOARequestStrategy,
    "SOARequestTransactions": SOARequestTransactions,
    "SOARequestWelcome": SOARequestWelcome,
    "SignIn": SignIn,
    "Whitepaper": Whitepaper,
    "AdminTeamMemberProfile": AdminTeamMemberProfile,
}

export const pagesConfig = {
    mainPage: "AdminAdviceGroupDetail",
    Pages: PAGES,
    Layout: __Layout,
};
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
import AdminAdviceGroups from './pages/AdminAdviceGroups';
import AdminAdvisers from './pages/AdminAdvisers';
import AdminClients from './pages/AdminClients';
import AdminCompleted from './pages/AdminCompleted';
import AdminDashboard from './pages/AdminDashboard';
import AdminDataManager from './pages/AdminDataManager';
import AdminHelp from './pages/AdminHelp';
import AdminProfile from './pages/AdminProfile';
import AdminQueue from './pages/AdminQueue';
import AdminSettings from './pages/AdminSettings';
import AdminTeam from './pages/AdminTeam';
import AdminTeamMemberProfile from './pages/AdminTeamMemberProfile';
import AdminTemplate from './pages/AdminTemplate';
import AdminTestSetup from './pages/AdminTestSetup';
import AdminTickets from './pages/AdminTickets';
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
import AdviceGroupTickets from './pages/AdviceGroupTickets';
import AdviserAdviceRecords from './pages/AdviserAdviceRecords';
import AdviserAdviceRecordDetail from './pages/AdviserAdviceRecordDetail';
import AdviserAnalytics from './pages/AdviserAnalytics';
import AdviserAvatarSetup from './pages/AdviserAvatarSetup';
import AdviserCalendar from './pages/AdviserCalendar';
import AdviserClientDetail from './pages/AdviserClientDetail';
import AdviserClients from './pages/AdviserClients';
import AdviserCompletions from './pages/AdviserCompletions';
import AdviserDashboard from './pages/AdviserDashboard';
import AdviserModels from './pages/AdviserModels';
import AdviserDocuments from './pages/AdviserDocuments';
import AdviserFactFinds from './pages/AdviserFactFinds';
import AdviserHelp from './pages/AdviserHelp';
import AdviserProfile from './pages/AdviserProfile';
import AdviserSOARequests from './pages/AdviserSOARequests';
import AdviserSOATemplate from './pages/AdviserSOATemplate';
import AdviserSettings from './pages/AdviserSettings';
import AdviserTasks from './pages/AdviserTasks';
import AdviserTickets from './pages/AdviserTickets';
import AvatarMarketing from './pages/AvatarMarketing';
import Cashflow from './pages/Cashflow';
import ClientAdviceHistory from './pages/ClientAdviceHistory';
import ClientCashflow from './pages/ClientCashflow';
import ClientDashboard from './pages/ClientDashboard';
import ClientDocuments from './pages/ClientDocuments';
import ClientFactFindAI from './pages/ClientFactFindAI';
import ClientFactFindForm from './pages/ClientFactFindForm';
import ClientHelp from './pages/ClientHelp';
import ClientMessages from './pages/ClientMessages';
import ClientProfile from './pages/ClientProfile';
import ClientSettings from './pages/ClientSettings';
import FactFindAboutYou from './pages/FactFindAboutYou';
import FactFindAdviceReason from './pages/FactFindAdviceReason';
import FactFindAssetsLiabilities from './pages/FactFindAssetsLiabilities';
import FactFindAssistant from './pages/FactFindAssistant';
import FactFindDashboard from './pages/FactFindDashboard';
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
import ProductResearch from './pages/ProductResearch';
import MyProfile from './pages/MyProfile';
import PublicAbout from './pages/PublicAbout';
import PublicContact from './pages/PublicContact';
import PublicHome from './pages/PublicHome';
import PublicPricing from './pages/PublicPricing';
import Register from './pages/Register';
import SOABuilder from './pages/SOABuilder';
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
import TestVerifyOtp from './pages/TestVerifyOtp';
import VerifyEmail from './pages/VerifyEmail';
import Whitepaper from './pages/Whitepaper';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAdviceGroups": AdminAdviceGroups,
    "AdminAdvisers": AdminAdvisers,
    "AdminClients": AdminClients,
    "AdminCompleted": AdminCompleted,
    "AdminDashboard": AdminDashboard,
    "AdminDataManager": AdminDataManager,
    "AdminHelp": AdminHelp,
    "AdminProfile": AdminProfile,
    "AdminQueue": AdminQueue,
    "AdminSettings": AdminSettings,
    "AdminTeam": AdminTeam,
    "AdminTeamMemberProfile": AdminTeamMemberProfile,
    "AdminTemplate": AdminTemplate,
    "AdminTestSetup": AdminTestSetup,
    "AdminTickets": AdminTickets,
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
    "AdviceGroupTickets": AdviceGroupTickets,
    "AdviserAdviceRecords": AdviserAdviceRecords,
    "AdviserAdviceRecordDetail": AdviserAdviceRecordDetail,
    "AdviserAnalytics": AdviserAnalytics,
    "AdviserAvatarSetup": AdviserAvatarSetup,
    "AdviserCalendar": AdviserCalendar,
    "AdviserClientDetail": AdviserClientDetail,
    "AdviserClients": AdviserClients,
    "AdviserCompletions": AdviserCompletions,
    "AdviserDashboard": AdviserDashboard,
    "AdviserDocuments": AdviserDocuments,
    "AdviserFactFinds": AdviserFactFinds,
    "AdviserHelp": AdviserHelp,
    "AdviserModels": AdviserModels,
    "AdviserProfile": AdviserProfile,
    "AdviserSOARequests": AdviserSOARequests,
    "AdviserSOATemplate": AdviserSOATemplate,
    "AdviserSettings": AdviserSettings,
    "AdviserTasks": AdviserTasks,
    "AdviserTickets": AdviserTickets,
    "AvatarMarketing": AvatarMarketing,
    "Cashflow": Cashflow,
    "ClientAdviceHistory": ClientAdviceHistory,
    "ClientCashflow": ClientCashflow,
    "ClientDashboard": ClientDashboard,
    "ClientDocuments": ClientDocuments,
    "ClientFactFindAI": ClientFactFindAI,
    "ClientFactFindForm": ClientFactFindForm,
    "ClientHelp": ClientHelp,
    "ClientMessages": ClientMessages,
    "ClientProfile": ClientProfile,
    "ClientSettings": ClientSettings,
    "FactFindAboutYou": FactFindAboutYou,
    "FactFindAdviceReason": FactFindAdviceReason,
    "FactFindAssetsLiabilities": FactFindAssetsLiabilities,
    "FactFindAssistant": FactFindAssistant,
    "FactFindDashboard": FactFindDashboard,
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
    "ProductResearch": ProductResearch,
    "MyProfile": MyProfile,
    "PublicAbout": PublicAbout,
    "PublicContact": PublicContact,
    "PublicHome": PublicHome,
    "PublicPricing": PublicPricing,
    "Register": Register,
    "SOABuilder": SOABuilder,
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
    "TestVerifyOtp": TestVerifyOtp,
    "VerifyEmail": VerifyEmail,
    "Whitepaper": Whitepaper,
}

export const pagesConfig = {
    mainPage: "AdminAdviceGroups",
    Pages: PAGES,
    Layout: __Layout,
};
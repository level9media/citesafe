import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import { Capacitor } from "@capacitor/core";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CiteSafeApp from "./pages/CiteSafeApp";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";
import NativeAuthSuccess from "./pages/NativeAuthSuccess";

// On native iOS, the marketing landing page is irrelevant.
// Go straight to the app shell which handles auth state itself.
const RootRoute = Capacitor.isNativePlatform()
  ? () => <Redirect to="/inspect" />
  : Landing;

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={RootRoute} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/support"} component={Support} />
      <Route path={"/inspect"} component={CiteSafeApp} />
      <Route path={"/history"} component={CiteSafeApp} />
      <Route path={"/account"} component={CiteSafeApp} />
      <Route path={"/sites"} component={CiteSafeApp} />
      <Route path={"/team"} component={CiteSafeApp} />
      <Route path={"/native-auth-success"} component={NativeAuthSuccess} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

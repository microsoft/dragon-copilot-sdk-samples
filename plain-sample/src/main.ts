import {
  fluentButton,
  fluentMenu,
  fluentMenuItem,
  fluentProgressRing,
  fluentTextArea,
  fluentTooltip,
  provideFluentDesignSystem,
} from "@fluentui/web-components";
import { App } from "./app";
import { AuthEhrViaEntra } from "./auth-ehr-via-entra";
import "./styles/app.css";
import "./styles/recording.css";
import "./styles/account.css";
import "./styles/toast.css";

provideFluentDesignSystem().register(
  fluentButton(),
  fluentMenu(),
  fluentMenuItem(),
  fluentProgressRing(),
  fluentTextArea(),
  fluentTooltip(),
);

const auth = await AuthEhrViaEntra.create();
const app = new App(auth);

// Initialize the app
app.initialize();

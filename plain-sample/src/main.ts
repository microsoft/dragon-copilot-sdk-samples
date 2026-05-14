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
import { AuthViaEntra } from "./auth-via-entra";
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

const auth = await AuthViaEntra.create();
const app = new App(auth);

// Initialize the app
app.initialize();

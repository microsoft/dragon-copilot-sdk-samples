import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import {
  provideFluentDesignSystem,
  fluentButton,
  fluentMenu,
  fluentMenuItem,
  fluentTooltip,
  fluentDivider,
  fluentProgressRing,
} from '@fluentui/web-components';

provideFluentDesignSystem().register(
  fluentButton(),
  fluentMenu(),
  fluentMenuItem(),
  fluentTooltip(),
  fluentDivider(),
  fluentProgressRing(),
);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

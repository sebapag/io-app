/**
 * This file exports a function to create the whole theme of the application.
 * It takes our custom variables and mixes them with each defined component theme.
 */
import merge from "lodash/merge";
import getTheme from "native-base/src/theme/components";

import baseScreenComponentTheme from "./components/BaseScreenComponent";
import buttonTheme from "./components/Button";
import contentTheme from "./components/Content";
import h1Theme from "./components/H1";
import h2Theme from "./components/H2";
import h3Theme from "./components/H3";
import h4Theme from "./components/H4";
import h5Theme from "./components/H5";
import h6Theme from "./components/H6";
import headerTheme from "./components/Header";
import iconFontTheme from "./components/IconFont";
import inputTheme from "./components/Input";
import itemTheme from "./components/Item";
import listTheme from "./components/List";
import listItemTheme from "./components/ListItem";
import maskedInputTheme from "./components/MaskedInput";
import messageDetailsInfoComponentTheme from "./components/MessageDetailsInfoComponent";
import preferenceItemTheme from "./components/PreferenceItem";
import screenHeaderTheme from "./components/ScreenHeader";
import textTheme from "./components/Text";
import textWithIconTheme from "./components/TextWithIcon";
import viewTheme from "./components/View";
import { Theme } from "./types";
import variables from "./variables";

const theme = (): Theme => {
  const nbTheme = getTheme(variables);
  const overrides = {
    "NativeBase.Button": {
      ...buttonTheme()
    },
    "NativeBase.Content": {
      ...contentTheme()
    },
    "NativeBase.H1": {
      ...h1Theme()
    },
    "NativeBase.H2": {
      ...h2Theme()
    },
    "NativeBase.H3": {
      ...h3Theme()
    },
    "UIComponent.H4": {
      ...h4Theme()
    },
    "UIComponent.H5": {
      ...h5Theme()
    },
    "UIComponent.H6": {
      ...h6Theme()
    },
    "NativeBase.Header": {
      ...headerTheme()
    },
    "NativeBase.Item": {
      ...itemTheme()
    },
    "NativeBase.Text": {
      ...textTheme()
    },
    "NativeBase.Input": {
      ...inputTheme()
    },
    "UIComponent.TextWithIcon": {
      ...textWithIconTheme()
    },
    "UIComponent.IconFont": {
      ...iconFontTheme()
    },
    "NativeBase.ViewNB": {
      ...viewTheme()
    },
    "UIComponent.MessageDetailsInfoComponent": {
      ...messageDetailsInfoComponentTheme()
    },
    "UIComponent.PreferenceItem": {
      ...preferenceItemTheme()
    },
    "UIComponent.ScreenHeader": {
      ...screenHeaderTheme()
    },
    "NativeBase.List": {
      ...listTheme()
    },
    "NativeBase.ListItem": {
      ...listItemTheme()
    },
    "UIComponent.BaseScreenComponent": {
      ...baseScreenComponentTheme()
    },
    "UIComponent.MaskedInput": {
      ...maskedInputTheme()
    }
  };

  // We need ad deep merge
  return merge(nbTheme, overrides);
};

export default theme;

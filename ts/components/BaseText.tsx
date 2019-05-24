import { Text as NoScalingText } from "native-base";
import { Component } from "react";
import * as React from "react";
import { TextProperties } from "react-native";

export default class BaseText extends Component<Text> {
  public render() {
    const { ...textProps } = this.props;
    return <NoScalingText {...textProps} allowFontScaling={false} />;
  }
}
interface Text extends TextProperties {
  link?: boolean;
  bold?: boolean;
  italic?: boolean;
  leftAlign?: boolean;
  rightAlign?: boolean;
  alternativeBold?: boolean;
  white?: boolean;
  alignCenter?: boolean;
  primary?: boolean;
}

/**
 * This screen allows the user to select the payment method for a selected transaction
 * TODO: "back" & "cancel" behavior to be implemented @https://www.pivotaltracker.com/story/show/159229087
 */
import { some } from "fp-ts/lib/Option";
import { AmountInEuroCents, RptId } from "italia-pagopa-commons/lib/pagopa";
import * as pot from "italia-ts-commons/lib/pot";
import { Content, H1, List, Text, View } from "native-base";
import * as React from "react";
import { StyleSheet } from "react-native";
import { NavigationInjectedProps } from "react-navigation";
import { connect } from "react-redux";

import { PaymentRequestsGetResponse } from "../../../../definitions/backend/PaymentRequestsGetResponse";
import { withLoadingSpinner } from "../../../components/helpers/withLoadingSpinner";
import BaseScreenComponent from "../../../components/screens/BaseScreenComponent";
import FooterWithButtons from "../../../components/ui/FooterWithButtons";
import CardComponent from "../../../components/wallet/card/CardComponent";
import PaymentBannerComponent from "../../../components/wallet/PaymentBannerComponent";
import I18n from "../../../i18n";
import {
  navigateToPaymentTransactionSummaryScreen,
  navigateToWalletAddPaymentMethod
} from "../../../store/actions/navigation";
import { Dispatch } from "../../../store/actions/types";
import { GlobalState } from "../../../store/reducers/types";
import { walletsSelector } from "../../../store/reducers/wallet/wallets";
import variables from "../../../theme/variables";
import { Wallet } from "../../../types/pagopa";
import { UNKNOWN_RECIPIENT } from "../../../types/unknown";
import { AmountToImporto } from "../../../utils/amounts";
import { showToast } from "../../../utils/showToast";
import { dispatchPickPspOrConfirm } from "./common";

type NavigationParams = Readonly<{
  rptId: RptId;
  initialAmount: AmountInEuroCents;
  verifica: PaymentRequestsGetResponse;
  idPayment: string;
}>;

type OwnProps = NavigationInjectedProps<NavigationParams>;

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  OwnProps;

const styles = StyleSheet.create({
  paddedLR: {
    paddingLeft: variables.contentPadding,
    paddingRight: variables.contentPadding
  }
});

class PickPaymentMethodScreen extends React.Component<Props> {
  public render(): React.ReactNode {
    const verifica = this.props.navigation.getParam("verifica");

    const paymentReason = verifica.causaleVersamento; // this could be empty as per pagoPA definition
    const currentAmount = AmountToImporto.encode(
      verifica.importoSingoloVersamento
    );
    const recipient = verifica.enteBeneficiario;

    const { wallets } = this.props;

    const primaryButtonProps = {
      block: true,
      onPress: this.props.navigateToAddPaymentMethod,
      title: I18n.t("wallet.newPaymentMethod.addButton")
    };

    const secondaryButtonProps = {
      block: true,
      bordered: true,
      onPress: this.props.navigateToTransactionSummary,
      title: I18n.t("global.buttons.cancel")
    };

    return (
      <BaseScreenComponent
        goBack={true}
        headerTitle={I18n.t("wallet.payWith.header")}
      >
        <Content noPadded={true}>
          <PaymentBannerComponent
            paymentReason={paymentReason}
            currentAmount={currentAmount}
            recipient={recipient || UNKNOWN_RECIPIENT}
            onCancel={this.props.navigateToTransactionSummary}
          />

          <View style={styles.paddedLR}>
            <View spacer={true} />
            <H1>
              {I18n.t(
                wallets.length > 0
                  ? "wallet.payWith.title"
                  : "wallet.payWith.noWallets.title"
              )}
            </H1>
            <View spacer={true} />
            <Text>
              {I18n.t(
                wallets.length > 0
                  ? "wallet.payWith.text"
                  : "wallet.payWith.noWallets.text"
              )}
            </Text>
            <View spacer={true} />
            <List
              removeClippedSubviews={false}
              dataArray={wallets as any[]} // tslint:disable-line: readonly-array
              renderRow={(item): React.ReactElement<any> => (
                <CardComponent
                  type="Picking"
                  wallet={item}
                  mainAction={this.props.navigateToConfirmOrPickPsp}
                />
              )}
            />
          </View>
        </Content>

        <View spacer={true} />

        <FooterWithButtons
          type="TwoButtonsInlineThird"
          leftButton={secondaryButtonProps}
          rightButton={primaryButtonProps}
        />
      </BaseScreenComponent>
    );
  }
}

const mapStateToProps = (state: GlobalState) => {
  const potWallets = walletsSelector(state);
  const potPsps = state.wallet.payment.psps;
  const isLoading = pot.isLoading(potWallets) || pot.isLoading(potPsps);
  return {
    wallets: pot.getOrElse(potWallets, []),
    isLoading
  };
};

const mapDispatchToProps = (dispatch: Dispatch, props: OwnProps) => ({
  navigateToTransactionSummary: () =>
    dispatch(
      navigateToPaymentTransactionSummaryScreen({
        rptId: props.navigation.getParam("rptId"),
        initialAmount: props.navigation.getParam("initialAmount")
      })
    ),
  navigateToConfirmOrPickPsp: (wallet: Wallet) => {
    dispatchPickPspOrConfirm(dispatch)(
      props.navigation.getParam("rptId"),
      props.navigation.getParam("initialAmount"),
      props.navigation.getParam("verifica"),
      props.navigation.getParam("idPayment"),
      some(wallet),
      failureReason => {
        // selecting the payment method has failed, show a toast and stay in
        // this screen

        if (failureReason === "FETCH_PSPS_FAILURE") {
          // fetching the PSPs for the payment has failed
          showToast(I18n.t("wallet.payWith.fetchPspFailure"), "warning");
        } else if (failureReason === "NO_PSPS_AVAILABLE") {
          // this wallet cannot be used for this payment
          // TODO: perhaps we can temporarily hide the selected wallet from
          //       the list of available wallets
          showToast(I18n.t("wallet.payWith.noPspsAvailable"), "danger");
        }
      }
    );
  },
  navigateToAddPaymentMethod: () =>
    dispatch(
      navigateToWalletAddPaymentMethod({
        inPayment: some({
          rptId: props.navigation.getParam("rptId"),
          initialAmount: props.navigation.getParam("initialAmount"),
          verifica: props.navigation.getParam("verifica"),
          idPayment: props.navigation.getParam("idPayment")
        })
      })
    )
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLoadingSpinner(PickPaymentMethodScreen));

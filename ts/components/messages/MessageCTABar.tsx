import { fromNullable, isSome } from "fp-ts/lib/Option";
import { capitalize } from "lodash";
import { Button, H3, Text, View } from "native-base";
import * as React from "react";
import { Alert, StyleSheet, ViewStyle } from "react-native";
import RNCalendarEvents, { Calendar } from "react-native-calendar-events";
import { connect } from "react-redux";

import { CreatedMessageWithContent } from "../../../definitions/backend/CreatedMessageWithContent";
import { ServicePublic } from "../../../definitions/backend/ServicePublic";
import I18n from "../../i18n";
import { NavigationParams } from "../../screens/wallet/payment/TransactionSummaryScreen";
import {
  addCalendarEvent,
  AddCalendarEventPayload,
  removeCalendarEvent,
  RemoveCalendarEventPayload
} from "../../store/actions/calendarEvents";
import { navigateToPaymentTransactionSummaryScreen } from "../../store/actions/navigation";
import { preferredCalendarSaveSuccess } from "../../store/actions/persistedPreferences";
import { Dispatch } from "../../store/actions/types";
import { paymentInitializeState } from "../../store/actions/wallet/payment";
import {
  CalendarEvent,
  calendarEventByMessageIdSelector
} from "../../store/reducers/entities/calendarEvents/calendarEventsByMessageId";
import { PaidReason } from "../../store/reducers/entities/payments";
import { GlobalState } from "../../store/reducers/types";
import variables from "../../theme/variables";
import { checkAndRequestPermission } from "../../utils/calendar";
import {
  formatDateAsDay,
  formatDateAsMonth,
  formatDateAsReminder
} from "../../utils/dates";
import {
  formatPaymentAmount,
  getAmountFromPaymentAmount,
  getRptIdFromNoticeNumber
} from "../../utils/payment";
import { showToast } from "../../utils/showToast";
import CalendarIconComponent from "../CalendarIconComponent";
import { withLightModalContext } from "../helpers/withLightModalContext";
import SelectCalendarModal from "../SelectCalendarModal";
import IconFont from "../ui/IconFont";
import { LightModalContextInterface } from "../ui/LightModal";

type OwnProps = {
  message: CreatedMessageWithContent;
  service?: ServicePublic;
  payment?: PaidReason;
  containerStyle?: ViewStyle;
  disabled?: boolean;
  small?: boolean;
};

type Props = OwnProps &
  LightModalContextInterface &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

type State = {
  // Store if the event is in the device calendar
  isEventInCalendar: boolean;
};

const styles = StyleSheet.create({
  mainContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "row"
  },

  reminderContainer: {
    display: "flex",
    flexDirection: "row",
    flex: 6,
    alignItems: "center"
  },

  reminderButtonContainer: {
    marginLeft: 10,
    flex: 12
  },

  reminderButton: {
    backgroundColor: variables.colorWhite
  },

  reminderButtonIcon: {
    marginLeft: 0,
    marginRight: 5
  },

  reminderButtonText: {
    paddingLeft: 0,
    paddingRight: 0
  },

  separatorContainer: {
    width: 10
  },

  paymentContainer: {
    flex: 6
  },

  paymentButtonPaid: {
    backgroundColor: variables.colorWhite,
    borderWidth: 1,
    borderColor: "#00C5CA"
  },

  paymentButtonText: {
    paddingLeft: 0,
    paddingRight: 0
  },

  paymentButtonPaidText: {
    color: "#00C5CA"
  },

  paymentButtonIcon: {
    marginLeft: 0,
    marginRight: 5
  },

  selectCalendaModalHeader: {
    lineHeight: 40
  }
});

const SelectCalendarModalHeader = (
  <View>
    <H3 style={styles.selectCalendaModalHeader}>
      {I18n.t("messages.cta.reminderCalendarSelect")}
    </H3>
    <View spacer={true} large={true} />
  </View>
);

class MessageCTABar extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEventInCalendar: false
    };
  }

  public componentDidMount() {
    const { calendarEvent } = this.props;

    // If we have a calendar event in the store associated to this message
    if (calendarEvent) {
      // Check if the event is still in the device calendar
      this.checkIfEventInCalendar(calendarEvent);
    }
  }

  private renderReminderCTA(
    dueDate: NonNullable<CreatedMessageWithContent["content"]["due_date"]>,
    useShortLabel: boolean
  ) {
    const {
      message,
      calendarEvent,
      disabled,
      preferredCalendar,
      showModal
    } = this.props;
    const { isEventInCalendar } = this.state;

    const calendarIconComponentSize = this.props.small ? 32 : 48;

    // Create an action to add or remove the event
    const onPressHandler = () => {
      // Check the authorization status
      checkAndRequestPermission()
        .then(hasPermission => {
          if (hasPermission) {
            if (calendarEvent && isEventInCalendar) {
              // If the event is in the calendar prompt an alert and ask for confirmation
              Alert.alert(
                I18n.t("messages.cta.reminderRemoveRequest.title"),
                undefined,
                [
                  {
                    text: I18n.t("messages.cta.reminderRemoveRequest.cancel"),
                    style: "cancel"
                  },
                  {
                    text: I18n.t("messages.cta.reminderRemoveRequest.ok"),
                    style: "destructive",
                    onPress: () => {
                      // after confirmation remove it
                      this.removeReminderFromCalendar(calendarEvent);
                    }
                  }
                ],
                { cancelable: false }
              );
            } else if (preferredCalendar !== undefined) {
              this.addReminderToCalendar(message, dueDate)(preferredCalendar);
            } else {
              // The event need to be added
              // Show a modal to let the user select a calendar
              showModal(
                <SelectCalendarModal
                  onCancel={this.onSelectCalendarCancel}
                  onCalendarSelected={this.addReminderToCalendar(
                    message,
                    dueDate
                  )}
                  header={SelectCalendarModalHeader}
                />
              );
            }
          }
        })
        // No permission to add/remove the reminder
        .catch();
    };

    return (
      <View style={styles.reminderContainer}>
        <CalendarIconComponent
          height={calendarIconComponentSize}
          width={calendarIconComponentSize}
          month={capitalize(formatDateAsMonth(dueDate))}
          day={formatDateAsDay(dueDate)}
          backgroundColor={variables.brandDarkGray}
          textColor={variables.colorWhite}
        />

        <View style={styles.reminderButtonContainer}>
          <Button
            block={true}
            xsmall={this.props.small}
            bordered={true}
            onPress={onPressHandler}
            disabled={disabled}
            style={styles.reminderButton}
          >
            {isEventInCalendar ? (
              <IconFont
                name={"io-tick-big"}
                style={styles.reminderButtonIcon}
                color={variables.contentPrimaryBackground}
              />
            ) : (
              <IconFont
                name={"io-plus"}
                style={styles.reminderButtonIcon}
                color={variables.contentPrimaryBackground}
              />
            )}
            <Text style={styles.reminderButtonText}>
              {I18n.t(
                useShortLabel
                  ? "messages.cta.reminderShort"
                  : "messages.cta.reminder"
              )}
            </Text>
          </Button>
        </View>
      </View>
    );
  }

  private renderPaymentCTA(
    paymentData: NonNullable<
      CreatedMessageWithContent["content"]["payment_data"]
    >,
    service?: ServicePublic,
    payment?: PaidReason
  ) {
    const { disabled } = this.props;
    const amount = getAmountFromPaymentAmount(paymentData.amount);

    const rptId = fromNullable(service).chain(_ =>
      getRptIdFromNoticeNumber(
        _.organization_fiscal_code,
        paymentData.notice_number
      )
    );

    const isPaid = payment !== undefined;

    const onPaymentCTAPress =
      !isPaid && isSome(amount) && rptId.isSome()
        ? () => {
            this.props.paymentInitializeState();
            this.props.navigateToPaymentTransactionSummaryScreen({
              rptId: rptId.value,
              initialAmount: amount.value
            });
          }
        : undefined;

    return (
      <View style={styles.paymentContainer}>
        <Button
          block={true}
          xsmall={this.props.small}
          onPress={onPaymentCTAPress}
          disabled={disabled || onPaymentCTAPress === undefined || isPaid}
          style={isPaid ? styles.paymentButtonPaid : undefined}
        >
          {isPaid && (
            <IconFont
              name="io-tick-big"
              style={styles.paymentButtonIcon}
              color={"#00C5CA"}
            />
          )}
          <Text
            style={[
              styles.paymentButtonText,
              isPaid ? styles.paymentButtonPaidText : undefined
            ]}
          >
            {I18n.t(isPaid ? "messages.cta.paid" : "messages.cta.pay", {
              amount: formatPaymentAmount(paymentData.amount)
            })}
          </Text>
        </Button>
      </View>
    );
  }

  public render() {
    const { message, service, payment, containerStyle } = this.props;

    const { due_date, payment_data } = message.content;

    if (due_date !== undefined || payment_data !== undefined) {
      return (
        <View style={[styles.mainContainer, containerStyle]}>
          {due_date !== undefined &&
            this.renderReminderCTA(due_date, payment_data !== undefined)}

          {due_date !== undefined &&
            payment_data !== undefined && (
              <View style={styles.separatorContainer} />
            )}

          {payment_data !== undefined &&
            this.renderPaymentCTA(payment_data, service, payment)}
        </View>
      );
    }

    return null;
  }

  /**
   * A function to check if the eventId of the CalendarEvent stored in redux
   * is really/still in the device calendar.
   * It is important to make this check because the event can be removed outside
   * the App.
   */
  private checkIfEventInCalendar = (calendarEvent: CalendarEvent) => {
    checkAndRequestPermission()
      .then(hasPermission => {
        if (hasPermission) {
          RNCalendarEvents.findEventById(calendarEvent.eventId)
            .then(event => {
              if (event) {
                // The event is in the store and also in the device calendar
                // Update the state to display and handle the reminder button correctly
                this.setState({
                  isEventInCalendar: true
                });
              } else {
                // The event is in the store but not in the device calendar.
                // Remove it from store too
                this.props.removeCalendarEvent(calendarEvent);
              }
            })
            .catch();
        }
      })
      .catch();
  };

  private onSelectCalendarCancel = () => {
    this.props.hideModal();
  };

  private addReminderToCalendar = (
    message: CreatedMessageWithContent,
    dueDate: Date
  ) => (calendar: Calendar) => {
    const title = I18n.t("messages.cta.reminderTitle", {
      title: message.content.subject
    });
    const { preferredCalendar } = this.props;

    this.props.hideModal();

    if (preferredCalendar === undefined) {
      this.props.savePreferredCalendar(calendar);
    }

    RNCalendarEvents.saveEvent(title, {
      calendarId: calendar.id,
      startDate: formatDateAsReminder(dueDate),
      endDate: formatDateAsReminder(dueDate),
      allDay: true,
      alarms: []
    })
      .then(eventId => {
        showToast(
          I18n.t("messages.cta.reminderAddSuccess", {
            title,
            calendarTitle: calendar.title
          }),
          "success"
        );
        // Add the calendar event to the store
        this.props.addCalendarEvent({
          messageId: message.id,
          eventId
        });

        this.setState({
          isEventInCalendar: true
        });
      })
      .catch(_ =>
        showToast(I18n.t("messages.cta.reminderAddFailure"), "danger")
      );
  };

  private removeReminderFromCalendar = (calendarEvent: CalendarEvent) => {
    RNCalendarEvents.removeEvent(calendarEvent.eventId)
      .then(_ => {
        showToast(I18n.t("messages.cta.reminderRemoveSuccess"), "success");
        this.props.removeCalendarEvent({
          messageId: calendarEvent.messageId
        });
        this.setState({
          isEventInCalendar: false
        });
      })
      .catch(_ =>
        showToast(I18n.t("messages.cta.reminderRemoveFailure"), "danger")
      );
  };
}

const mapStateToProps = (state: GlobalState, ownProps: OwnProps) => ({
  calendarEvent: calendarEventByMessageIdSelector(ownProps.message.id)(state),
  preferredCalendar: state.persistedPreferences.preferredCalendar
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  paymentInitializeState: () => dispatch(paymentInitializeState()),
  navigateToPaymentTransactionSummaryScreen: (params: NavigationParams) =>
    dispatch(navigateToPaymentTransactionSummaryScreen(params)),
  addCalendarEvent: (calendarEvent: AddCalendarEventPayload) =>
    dispatch(addCalendarEvent(calendarEvent)),
  removeCalendarEvent: (calendarEvent: RemoveCalendarEventPayload) =>
    dispatch(removeCalendarEvent(calendarEvent)),
  savePreferredCalendar: (calendar: Calendar) =>
    dispatch(
      preferredCalendarSaveSuccess({
        preferredCalendar: calendar
      })
    )
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLightModalContext(MessageCTABar));

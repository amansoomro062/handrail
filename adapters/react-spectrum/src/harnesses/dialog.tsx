import {
  ActionButton,
  Button,
  ButtonGroup,
  Content,
  defaultTheme,
  Dialog,
  DialogTrigger,
  Heading,
  Provider,
} from "@adobe/react-spectrum";
import { TEXT } from "@railing-dev/harness-kit";

/**
 * Adobe React Spectrum modal dialog: the calibration control.
 *
 * This adapter is not here to measure React Spectrum. It is here to measure
 * *us*. React Spectrum is widely regarded as the accessibility gold standard,
 * so any assertion it fails is presumed to be over-strict or wrong until
 * demonstrated otherwise, and no result for any subject library may be
 * published until this one scores at least 95%.
 *
 * As with every adapter: nothing here manages focus, adds ARIA, or handles
 * keys. The two plain inputs are harness furniture, deliberately plain rather
 * than Spectrum TextFields, so that both adapters traverse an identical set of
 * three focusable elements and the focus-trap counts stay comparable.
 */
export function DialogHarness() {
  return (
    <Provider theme={defaultTheme}>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <DialogTrigger type="modal">
        <ActionButton data-testid="hr-trigger">{TEXT.dialogTrigger}</ActionButton>
        {(close) => (
          <Dialog data-testid="hr-dialog">
            <Heading data-testid="hr-title">{TEXT.dialogTitle}</Heading>
            <Content>
              <input data-testid="hr-field-1" type="text" aria-label="Field one" />
              <input data-testid="hr-field-2" type="text" aria-label="Field two" />
            </Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={close} data-testid="hr-close">
                {TEXT.close}
              </Button>
            </ButtonGroup>
          </Dialog>
        )}
      </DialogTrigger>

      <button data-testid="hr-outside-content" type="button">
        {TEXT.outsideContent}
      </button>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </Provider>
  );
}

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import fileOpenDialog from 'utils/file-open-dialog';
import {
  FINISHED_STATUSES,
  STARTED,
  COMPLETED,
  CANCELED,
  FAILED
} from 'constants/process-status';

import {
  OPTIONS as OPTIONS_STEP,
  PREVIEW as PREVIEW_STEP
} from 'constants/import-step';

import ProgressBar from 'components/progress-bar';
import ErrorBox from 'components/error-box';
import ImportPreview from 'components/import-preview';
import ImportOptions from 'components/import-options';

import {
  startImport,
  cancelImport,
  setStep,
  selectImportFileType,
  selectImportFileName,
  setDelimiter,
  setStopOnErrors,
  setIgnoreBlanks,
  closeImport,
  toggleIncludeField,
  setFieldType
} from 'modules/import';

/**
 * Progress messages.
 */
const MESSAGES = {
  [STARTED]: 'Importing documents...',
  [CANCELED]: 'Import canceled',
  [COMPLETED]: 'Import completed',
  [FAILED]: 'Error importing'
};

class ImportModal extends PureComponent {
  static propTypes = {
    open: PropTypes.bool,
    ns: PropTypes.string.isRequired,
    startImport: PropTypes.func.isRequired,
    cancelImport: PropTypes.func.isRequired,
    closeImport: PropTypes.func.isRequired,
    step: PropTypes.string.isRequired,
    setStep: PropTypes.func.isRequired,

    /**
     * Shared
     */
    error: PropTypes.object,
    status: PropTypes.string.isRequired,

    /**
     * See `<ImportOptions />`
     */
    selectImportFileType: PropTypes.func.isRequired,
    selectImportFileName: PropTypes.func.isRequired,
    setDelimiter: PropTypes.func.isRequired,
    delimiter: PropTypes.string,
    fileType: PropTypes.string,
    fileName: PropTypes.string,
    stopOnErrors: PropTypes.bool,
    setStopOnErrors: PropTypes.func,
    ignoreBlanks: PropTypes.bool,
    setIgnoreBlanks: PropTypes.func,

    /**
     * See `<ProgressBar />`
     */
    progress: PropTypes.number.isRequired,
    docsWritten: PropTypes.number,
    guesstimatedDocsTotal: PropTypes.number,

    /**
     * See `<ImportPreview />`
     */
    fields: PropTypes.array,
    values: PropTypes.array,
    toggleIncludeField: PropTypes.func.isRequired,
    setFieldType: PropTypes.func.isRequired
  };

  /**
   * Handle clicking the cancel button.
   */
  handleCancel = () => {
    this.props.cancelImport();
  };

  /**
   * Handle clicking the close button.
   */
  handleClose = () => {
    this.handleCancel();
    this.props.closeImport();
  };

  /**
   * Handle clicking the import button.
   */
  handleImportBtnClicked = () => {
    this.props.startImport();
  };

  // TODO: lucas: Make COMPLETED, FINISHED_STATUSES
  // have better names.
  // COMPLETED = Done and Successful
  // FINISHED_STATUSES = Done and maybe success|error|canceled
  /**
   * Has the import completed successfully?
   * @returns {Boolean}
   */
  wasImportSuccessful() {
    return this.props.status === COMPLETED;
  }

  renderDoneButton() {
    if (!this.wasImportSuccessful()) {
      return null;
    }
    return (
      <TextButton
        className="btn btn-primary btn-sm"
        text="DONE"
        clickHandler={this.handleClose}
      />
    );
  }

  renderCancelButton() {
    if (this.props.status !== COMPLETED) {
      return (
        <TextButton
          className="btn btn-default btn-sm"
          text={
            FINISHED_STATUSES.includes(this.props.status) ? 'Close' : 'Cancel'
          }
          clickHandler={this.handleClose}
        />
      );
    }
  }

  renderImportButton() {
    if (this.wasImportSuccessful()) {
      return null;
    }
    return (
      <TextButton
        className="btn btn-primary btn-sm"
        text={this.props.status === STARTED ? 'Importing...' : 'Import'}
        disabled={!this.props.fileName || this.props.status === STARTED}
        clickHandler={this.handleImportBtnClicked}
      />
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <Modal show={this.props.open} onHide={this.handleClose} backdrop="static">
        <Modal.Header closeButton>
          Import To Collection {this.props.ns}
        </Modal.Header>
        <Modal.Body>
          {this.props.step === OPTIONS_STEP && (
            <ImportOptions
              delimiter={this.props.delimiter}
              setDelimiter={this.props.setDelimiter}
              fileType={this.props.fileType}
              selectImportFileType={this.props.selectImportFileType}
              fileName={this.props.fileName}
              selectImportFileName={this.props.selectImportFileName}
              stopOnErrors={this.props.stopOnErrors}
              setStopOnErrors={this.props.setStopOnErrors}
              ignoreBlanks={this.props.ignoreBlanks}
              setIgnoreBlanks={this.props.setIgnoreBlanks}
              fileOpenDialog={fileOpenDialog}
            />
          )}

          {this.props.step === PREVIEW_STEP && (
            <ImportPreview
              onFieldCheckedChanged={this.props.toggleIncludeField}
              setFieldType={this.props.setFieldType}
              values={this.props.values}
              fields={this.props.fields}
            />
          )}

          <ProgressBar
            progress={this.props.progress}
            status={this.props.status}
            message={MESSAGES[this.props.status]}
            cancel={this.props.cancelImport}
            docsWritten={this.props.docsWritten}
            guesstimatedDocsTotal={this.props.guesstimatedDocsTotal}
          />
          <ErrorBox error={this.props.error} />
        </Modal.Body>
        <Modal.Footer>
          {this.props.step === PREVIEW_STEP && (
            <TextButton
              className="btn btn-default btn-sm"
              text={this.props.status === STARTED ? '< SELECT IMPORT FILE' : ''}
              disabled={this.props.status === STARTED}
              clickHandler={() => {
                this.props.setStep(OPTIONS_STEP);
              }}
            />
          )}
          {this.renderCancelButton()}
          {this.renderImportButton()}
          {this.renderDoneButton()}
        </Modal.Footer>
      </Modal>
    );
  }
}

// TODO: lucas: move connect() and mapStateToProps() to ../../import-plugin.js.
/**
 * Map the state of the store to component properties.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  ns: state.ns,
  step: state.importData.step,
  progress: state.importData.progress,
  open: state.importData.isOpen,
  error: state.importData.error,
  fileType: state.importData.fileType,
  fileName: state.importData.fileName,
  status: state.importData.status,
  docsWritten: state.importData.docsWritten,
  guesstimatedDocsTotal: state.importData.guesstimatedDocsTotal,
  delimiter: state.importData.delimiter,
  stopOnErrors: state.importData.stopOnErrors,
  ignoreBlanks: state.importData.ignoreBlanks,
  fields: state.importData.fields,
  values: state.importData.values
});

/**
 * Export the connected component as the default.
 */
export default connect(
  mapStateToProps,
  {
    startImport,
    cancelImport,
    setStep,
    selectImportFileType,
    selectImportFileName,
    setDelimiter,
    setStopOnErrors,
    setIgnoreBlanks,
    closeImport,
    toggleIncludeField,
    setFieldType
  }
)(ImportModal);

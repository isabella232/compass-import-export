import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Switch from 'react-ios-switch';
import classnames from 'classnames';
import {
  Modal,
  Button,
  FormGroup,
  InputGroup,
  FormControl,
  ControlLabel
} from 'react-bootstrap';
import { TextButton, IconTextButton } from 'hadron-react-buttons';
import QueryViewer from 'components/query-viewer';
import ProgressBar from 'components/progress-bar';
import fileSaveDialog from 'utils/file-save-dialog';
import revealFile from 'utils/reveal-file';
import PROCESS_STATUS, { STARTED, CANCELED, COMPLETED } from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';
import {
  startExport,
  cancelExport,
  toggleFullCollection,
  selectExportFileType,
  selectExportFileName,
  closeExport
} from 'modules/export';

import styles from './export-modal.less';
import createStyler from 'utils/styler.js';
const style = createStyler(styles, 'export-modal');

/**
 * Progress messages.
 */
const MESSAGES = {
  [STARTED]: 'Exporting documents...',
  [CANCELED]: 'Export canceled',
  [COMPLETED]: 'Export completed'
};

/**
 * The export collection modal.
 */
class ExportModal extends PureComponent {
  static propTypes = {
    open: PropTypes.bool,
    ns: PropTypes.string.isRequired,
    count: PropTypes.number,
    query: PropTypes.object.isRequired,
    progress: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    error: PropTypes.object,
    startExport: PropTypes.func.isRequired,
    cancelExport: PropTypes.func.isRequired,
    closeExport: PropTypes.func.isRequired,
    isFullCollection: PropTypes.bool.isRequired,
    toggleFullCollection: PropTypes.func.isRequired,
    selectExportFileType: PropTypes.func.isRequired,
    selectExportFileName: PropTypes.func.isRequired,
    fileType: PropTypes.string,
    fileName: PropTypes.string,
    exportedDocsCount: PropTypes.number
  };

  /**
   * Get the status message.
   *
   * @returns {String} The status message.
   */
  getStatusMessage = () => {
    return (
      MESSAGES[this.props.status] ||
      (this.props.error ? this.props.error.message : '')
    );
  };

  /**
   * Handle choosing a file from the file dialog.
   */
  handleChooseFile = () => {
    const file = fileSaveDialog(this.props.fileType);
    if (file) {
      this.props.selectExportFileName(file);
    }
  };

  /**
   * Handle clicking the cancel button.
   */
  handleCancel = () => {
    this.props.cancelExport();
  };

  /**
   * Handle clicking the close button.
   */
  handleClose = () => {
    this.handleCancel();
    this.props.closeExport();
  };

  /**
   * Handle clicking the export button.
   */
  handleExport = () => {
    this.props.startExport();
  };

  handleRevealClick = () => {
    revealFile(this.props.fileName);
  };

  /**
   * Render the progress bar.
   *
   * @returns {React.Component} The component.
   */
  renderProgressBar = () => {
    if (this.props.status === PROCESS_STATUS.UNSPECIFIED) {
      return null;
    }

    return (
      <div>
        <ProgressBar
          progress={this.props.progress}
          status={this.props.status}
          message={this.getStatusMessage()}
          cancel={this.props.cancelExport}
          docsWritten={this.props.exportedDocsCount}
          docsTotal={this.props.count}
        />
      </div>
    );
  };

  renderImportButton() {
    if (this.props.status === COMPLETED) {
      return (
        <TextButton
          className="btn btn-primary btn-sm"
          text="Show File"
          clickHandler={this.handleRevealClick}
        />
      );
    }
    return (
      <TextButton
        className="btn btn-primary btn-sm"
        text="Export"
        disabled={this.props.status === STARTED}
        clickHandler={this.handleExport}
      />
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const { isFullCollection } = this.props;

    const queryClassName = classnames({
      [style('query')]: true,
      [style('query-is-disabled')]: isFullCollection
    });
    const queryViewerClassName = classnames({
      [style('query-viewer-is-disabled')]: isFullCollection
    });

    return (
      <Modal show={this.props.open} onHide={this.handleClose} backdrop="static">
        <Modal.Header closeButton>
          Export Collection {this.props.ns}
        </Modal.Header>
        <Modal.Body>
          <div className={queryClassName}>
            There are {this.props.count} documents in the collection. Exporting
            with the query:
          </div>
          <div className={queryViewerClassName}>
            <QueryViewer
              query={this.props.query}
              disabled={isFullCollection}
            />
          </div>
          <div className={style('toggle-full')}>
            <Switch
              checked={isFullCollection}
              onChange={this.props.toggleFullCollection}
              className={style('toggle-button')}
            />
            <div className={style('toggle-text')}>
              Export Full Collection
            </div>
          </div>
          <div className={style('output')}>
            Select Output File Type
          </div>
          <div
            className={style('type-selector')}
            type="radio"
            name="file-type-selector"
          >
            <Button
              className={classnames({
                [styles.selected]: this.props.fileType === FILE_TYPES.JSON
              })}
              onClick={this.props.selectExportFileType.bind(
                this,
                FILE_TYPES.JSON
              )}
            >
              JSON
            </Button>
            <Button
              className={classnames({
                [styles.selected]: this.props.fileType === FILE_TYPES.CSV
              })}
              onClick={this.props.selectExportFileType.bind(
                this,
                FILE_TYPES.CSV
              )}
            >
              CSV
            </Button>
          </div>
          <form>
            <FormGroup controlId="export-file">
              <ControlLabel>Select File</ControlLabel>
              <InputGroup
                bsClass={style('browse-group')}
              >
                <FormControl type="text" value={this.props.fileName} readOnly />
                <IconTextButton
                  text="Browse"
                  clickHandler={this.handleChooseFile}
                  className={style('browse-button')}
                  iconClassName="fa fa-folder-open-o"
                />
              </InputGroup>
            </FormGroup>
          </form>
          {this.renderProgressBar()}
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text={
              this.props.status === PROCESS_STATUS.COMPLETED
                ? 'Close'
                : 'Cancel'
            }
            clickHandler={this.handleClose}
          />
          {this.renderImportButton()}
        </Modal.Footer>
      </Modal>
    );
  }
}

/**
 * Map the state of the store to component properties.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = state => ({
  ns: state.ns,
  progress: state.exportData.progress,
  count: state.stats.rawDocumentCount,
  query: state.exportData.query,
  isFullCollection: state.exportData.isFullCollection,
  open: state.exportData.isOpen,
  error: state.exportData.error,
  fileType: state.exportData.fileType,
  fileName: state.exportData.fileName,
  status: state.exportData.status,
  exportedDocsCount: state.exportData.exportedDocsCount
});

/**
 * Export the connected component as the default.
 */
export default connect(
  mapStateToProps,
  {
    startExport,
    cancelExport,
    toggleFullCollection,
    selectExportFileType,
    selectExportFileName,
    closeExport
  }
)(ExportModal);

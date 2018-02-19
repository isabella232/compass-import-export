import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  Modal, Button, FormGroup, InputGroup, FormControl, ControlLabel, ProgressBar
} from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import QueryViewer from 'components/query-viewer';
import fileOpenDialog from 'utils/file-open-dialog';
import PROCESS_STATUS from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';
import CancelButton from 'components/cancel-button';

import styles from './export-modal.less';

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
    exportAction: PropTypes.func.isRequired,
    closeExport: PropTypes.func.isRequired,
    selectExportFileType: PropTypes.func.isRequired,
    selectExportFileName: PropTypes.func.isRequired,
    fileType: PropTypes.string,
    fileName: PropTypes.string
  };

  /**
   * Get the bootstrap progress bar style.
   *
   * @returns {String} The style.
   */
  getProgressStyle() {
    if (this.props.status === PROCESS_STATUS.STARTED) return 'info';
    if (this.props.status === PROCESS_STATUS.COMPLETED) return 'success';
    if (this.props.status === PROCESS_STATUS.CANCELED) return 'warning';
  }

  /**
   * Handle choosing a file from the file dialog.
   */
  handleChooseFile = () => {
    const file = fileOpenDialog(this.props.fileType);
    if (file) {
      this.props.selectExportFileName(file[0]);
    }
  }

  /**
   * Handle clicking the cancel button.
   */
  handleCancel = () => {
    this.props.exportAction(PROCESS_STATUS.CANCELLED);
  }

  /**
   * Handle clicking the close button.
   */
  handleClose = () => {
    this.handleCancel();
    this.props.closeExport();
  }

  /**
   * Handle clicking the export button.
   */
  handleExport = () => {
    if (this.props.fileName) {
      this.props.exportAction(PROCESS_STATUS.STARTED);
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const errorClassName = classnames({
      [ styles['export-modal-error'] ]: true,
      [ styles['export-modal-error-has-error'] ]: this.props.error ? true : false
    });
    return (
      <Modal show={this.props.open} onHide={this.handleClose} >
        <Modal.Header closeButton>
          Export Collection {this.props.ns}
        </Modal.Header>
        <Modal.Body>
          <div>
            Exporting {this.props.count} documents returned by the following query:
          </div>
          <div>
            <QueryViewer query={this.props.query} />
          </div>
          <div className={classnames(styles['export-modal-output'])}>
            Select Output File Type
          </div>
          <div
            className={classnames(styles['export-modal-type-selector'])}
            type="radio"
            name="file-type-selector">
            <Button
              className={classnames({[styles.selected]: this.props.fileType === FILE_TYPES.JSON})}
              onClick={this.props.selectExportFileType.bind(this, FILE_TYPES.JSON)}>JSON</Button>
            <Button
              className={classnames({[styles.selected]: this.props.fileType === FILE_TYPES.CSV})}
              onClick={this.props.selectExportFileType.bind(this, FILE_TYPES.CSV)}>CSV</Button>
          </div>
          <form>
            <FormGroup controlId="export-file">
              <ControlLabel>Select File</ControlLabel>
              <InputGroup>
                <FormControl type="text" value={this.props.fileName} readOnly />
                <InputGroup.Button>
                  <Button onClick={this.handleChooseFile}>Browse</Button>
                </InputGroup.Button>
              </InputGroup>
            </FormGroup>
          </form>
          <div className={classnames(styles['export-modal-progress'])}>
            <ProgressBar
              active
              now={this.props.progress}
              bsStyle={this.getProgressStyle()} />
            { this.props.status === PROCESS_STATUS.STARTED
                ? <CancelButton onClick={ this.handleCancel } />
                : null }
          </div>
          <div className={errorClassName}>
            {this.props.error ? this.props.error.message : null}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.handleClose} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="insert-document-button"
            text="Export"
            clickHandler={this.handleExport} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ExportModal;

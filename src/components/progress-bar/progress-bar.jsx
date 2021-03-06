import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  STARTED,
  CANCELED,
  COMPLETED,
  FAILED,
  UNSPECIFIED
} from 'constants/process-status';

import styles from './progress-bar.less';
import createStyler from 'utils/styler.js';
import formatNumber from 'utils/format-number.js';

const style = createStyler(styles, 'progress-bar');

/**
 * The progress bar component.
 */
class ProgressBar extends PureComponent {
  static displayName = 'ProgressBarComponent';

  static propTypes = {
    progress: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    docsWritten: PropTypes.number,
    docsTotal: PropTypes.number,
    cancel: PropTypes.func,
    guesstimatedDocsTotal: PropTypes.number // <- for import only
  };

  /**
   * Get the class name for the bar.
   *
   * @returns {String} The class name.
   */
  getBarClassName() {
    const { status } = this.props;
    return classnames({
      [style('bar')]: true,
      [style('bar-is-canceled')]: status === CANCELED,
      [style('bar-is-completed')]: status === COMPLETED,
      [style('bar-is-failed')]: status === FAILED
    });
  }
  getMessageClassName() {
    return classnames({
      [style('status-message')]: true,
      [style('status-message-is-failed')]: this.props.status === FAILED
    });
  }

  getCancelButton() {
    if (this.props.status !== STARTED) {
      return null;
    }

    return (
      // eslint-disable-next-line no-script-url
      <a className={style('status-message-cancel')} onClick={this.handleCancel}>
        Stop
      </a>
    );
  }

  /**
   * Cancel import or export event.
   * @param {Object} evt: click event
   */
  handleCancel = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    this.props.cancel();
  };

  renderStats() {
    const { docsTotal, docsWritten, progress } = this.props;
    // TODO: lucas: This is explicitly handling import case where
    // we don't know the exact number of documents to expect.
    // Could use the estimate set in modules/import progress?
    if (docsTotal === undefined) {
      return (
        <p
          className={style('status-stats')}
          title={
            'Estimated total: ' +
            formatNumber(this.props.guesstimatedDocsTotal)
          }
        >
          {formatNumber(docsWritten)}
          &nbsp;({formatNumber(progress)}%)
        </p>
      );
    }
    return (
      <p className={style('status-stats')}>
        {formatNumber(docsWritten)}/{formatNumber(docsTotal)}
        &nbsp;({formatNumber(progress)}%)
      </p>
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const { message, progress, status } = this.props;
    if (status === UNSPECIFIED) {
      return null;
    }

    return (
      <div className={style('chart-wrapper')}>
        <div className={style()}>
          <div
            className={this.getBarClassName()}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={styles['progress-bar-status']}>
          <p className={this.getMessageClassName()}>
            {message}
            {this.getCancelButton()}
          </p>
          {this.renderStats()}
        </div>
      </div>
    );
  }
}

export default ProgressBar;

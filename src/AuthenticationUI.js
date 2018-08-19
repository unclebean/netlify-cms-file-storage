import PropTypes from 'prop-types';
import React from 'react';

export default class AuthenticationUI extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
  };

  state = { email: '' };

  handleLogin = (e) => {
    e.preventDefault();
    // TODO calling authentication API to allow user logs in
    this.props.onLogin(this.state);
  };

  handleEmailChange = (value) => {
    this.setState({ email: value });
  };

  render() {
    const { inProgress } = this.props;

    return (<section className="fs-auth-page-root">
      <section className="fs-auth-page-card">
      <span></span>
        <button
          className="nc-githubAuthenticationPage-button"
          disabled={inProgress}
          onClick={this.handleLogin}
        >
          {inProgress ? "Logging in..." : "Login Local"}
        </button>
      </section>
    </section>);
  }
}

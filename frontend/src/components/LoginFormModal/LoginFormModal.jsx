import { useState } from 'react';
import * as sessionActions from '../../store/session';
import { useDispatch } from 'react-redux';
import { useModal } from '../../context/Modal';
import './LoginForm.css';

function LoginFormModal() {
  const dispatch = useDispatch();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { closeModal } = useModal();
  const minUserChars = 4;
  const minPassChars = 6;


  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    return dispatch(sessionActions.login({ credential, password }))
      .then(closeModal)
      .catch(async (res) => {
        const data = await res.json();
        if (data && data.errors) {
          setErrors(data.errors);
        }
      });
  };

  const handleDemoLogin = () => {
    return dispatch(sessionActions.login({ credential: 'demoUser', password: 'password' }))
      .then(closeModal)
      .catch(async (res) => {
        const data = await res.json();
        if (data && data.errors) {
          setErrors(data.errors);
        }
      });
  };

  const isButtonDisabled = credential.length < minUserChars || password.length < minPassChars;

  return (
    <div className="login-form-container">
    <div className="login-form">
      <h1 className="login-form__title">Log In</h1>
      <form onSubmit={handleSubmit}>
        <div className="login-form__input-container">
          <input
            type="text"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            required
          />
          <label className={credential ? 'active' : ''}>Username or Email</label>
        </div>
        <div className="login-form__input-container">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label className={password ? 'active' : ''}>Password</label>
        </div>
        {errors.credential && (
          <p className="login-form__error">{errors.credential}</p>
        )}
        <button type="submit" disabled={isButtonDisabled}>Log In</button>
      </form>
      <button className="login-form__demo-user" onClick={handleDemoLogin}>Log In as Demo User</button>
    </div>
    </div>
  );
}

export default LoginFormModal;

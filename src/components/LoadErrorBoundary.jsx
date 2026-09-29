import React from 'react';

// Ловит ошибки подгрузки ленивых экранов. Типичный случай: сайт обновили, а во вкладке
// осталась старая версия, чьих файлов на сервере уже нет, — помогает перезагрузка страницы.
export default class LoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="screen">
        <div className="summary">
          <h2>Не получилось загрузить</h2>
          <p>Возможно, пропал интернет или сайт обновился. Перезагрузи страницу.</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }
}

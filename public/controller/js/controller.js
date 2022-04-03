export default class Controller {
  constructor({ view, service }) {
    this.view = view;
    this.service = service;
  }

  static initialize(deps) {
    const controllerInstance = new Controller(deps);

    console.log("initialize CONTROLLER");

    controllerInstance.onLoad();

    return controllerInstance;
  }

  async commandReceived(text) {
    return this.service.makeRequest({ command: text.toLowerCase() });
  }

  onLoad() {
    this.view.configureOnBtnClick(this.commandReceived.bind(this));
    console.log("onLoad CONTROLLER");
    this.view.onLoad();
  }
}

import {Component} from '@angular/core';
import {NavController, LoadingController} from 'ionic-angular';

import {ConfigService} from '../../app/config.service';
import {User, UserService} from '../../app/user.service';
import {CheckIn2} from './check_in_2';

@Component({selector: 'page-check-in-1', templateUrl: 'check_in_1.html'})
export class CheckIn1 {
  eventId: string;
  phoneNum: number;
  errorMessage = '';

  constructor(
      public navCtrl: NavController, public configService: ConfigService,
      public userService: UserService, public loadingCtrl: LoadingController) {}

  checkLogin(phone: number, eventId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // clear the error message, if there is one
      this.errorMessage = '';

      // the config will determine which endpoint to use
      const apiEndpoint = this.configService.getEndpointUrl();
      const loginForm = {
        'phone': phone,
        'eventId': eventId
      }
      const formBody: string = this.configService.xwwwurlencode(loginForm);
      // make the HTTPRequest
      // see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
      fetch(`${apiEndpoint}update_checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formBody
      })

      // convert the blob request and JSON parse it asynchronously
      .then((blob) => blob.json())

      .then((json) => {
        // the id provided is valid - set the current user of the app to use
        // this id
        const selectedUser = new User(json.id);
        try {
          const name = json.name;
          selectedUser.setName(name);
        } catch (e) {
          console.error(`Could not get the user's name: ${e}`);
        }
        this.userService.setUser(selectedUser);

        resolve(true);
      })
      // handle HTTP errors
      .catch((err) => {
        console.error(err);
        console.error('Try turning on CORS or switching DEV_MODE');

        // if the response we get from the server is not valid json,
        // our attempt to JSON parse it above throws a SyntaxError
        // we always get invalid JSON when the ID is invalid
        if (err.name === 'SyntaxError') {
          this.errorMessage = 'Invalid Phone Number';
        }
        resolve(false);
      });
    });
    
  }

  onSubmitClick() {
    let loader = this.loadingCtrl.create({
      spinner: 'crescent',
      content: 'Validating...'
    });
    loader.present();
    this.checkLogin(this.phoneNum, this.eventId)
    .then(login_valid => {
      loader.dismiss();
      if(login_valid === true) {
        // navigate to the main page
        this.navCtrl.push(CheckIn2);
      }
    });
  }
}
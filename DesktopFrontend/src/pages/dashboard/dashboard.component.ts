import { Component, OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie';
import 'rxjs/add/operator/map';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
  errorMessage = '';
  bowls: any = [];

  constructor(private http: Http, private router: Router, private _cookieService:CookieService) {}

  ngOnInit() {
    this.loadItems();
  }

  // Gets the items into this.items by reading through the file
  loadItems() {
    let urlString = "/?token=" + this._cookieService.get("userFirebaseToken");
    this.http.get(urlString)
    .map(res => res.json())
    .subscribe(json => {
      this.bowls = json;
    }, this.showError('reach database'));
  }

  postAssignment(volunteer: any) {
    this.errorMessage = '';
    this.http.post('/update_assignment',
      {
        uid : volunteer.id,
        assignment : volunteer.new_assignment
      }
    )
    .subscribe(
      () => {
        volunteer.assignment = volunteer.new_assignment;
        console.log('updated assignment')
      },
      this.showError(`update assignment for ${volunteer.name}`));
  }

  postLocation(volunteer: any) {
    this.errorMessage = '';
    this.http.post('/update_location',
      {
        uid : volunteer.id,
        location : volunteer.new_location
      }
    )
    .subscribe(
      ()=>{
        volunteer.location = volunteer.new_location;
        console.log('updated location')
      },
      this.showError(`update location for ${volunteer.name}`));
  }

  postMessage(bowl: any) {
    if(!bowl.new_message || bowl.new_message === bowl.message){
      console.log("nope");
      return;
    }
    this.errorMessage = '';
    this.http.post('/update_message',
      {
        eventId: bowl.id,
        message : bowl.new_message
      }
    )
    .subscribe((res) => {
      bowl.message = bowl.new_message;
      console.log('updated message');
    }, this.showError(`update message for ${bowl.name}`));

  }

  enableEditing(volunteer: any) {
    volunteer.edit = true;
  }

  showError = (action: string) => (message: any) => {
    console.error(message);
    this.errorMessage = `Server error: Could not ${action}.`;
  }

  saveEdits(volunteer: any){
    if(volunteer.new_location !== volunteer.location && volunteer.new_location) {
      this.postLocation(volunteer);
    }

    if(volunteer.new_assignment !== volunteer.assignment && volunteer.new_assignment) {
      this.postAssignment(volunteer);
    }

    volunteer.edit = false;
  }

  goToCreateEvent(){
    this.router.navigate(['/create-event']);
  }

  sendCheckoutReminder(bowl){
    this.http.post('/update_reminder',
      {
        eventId: bowl.id
      }
    )
    .subscribe((res) => {
      console.log('reminder', res);
    },
    this.showError(`send reminder for ${bowl.name}`));
  }

  deleteBowl(bowl){
    bowl.deleting = true;
  }

  confirmDelete(bowl){
    console.log("confirm delete");

    this.errorMessage = '';
    this.http.post('/delete_event',
      {
        eventId : bowl.id
      }
    )
    .subscribe(
      ()=>{
        console.log(`deleted ${bowl.name}`);
        bowl.deleted = true;
      },
      this.showError(`delete event ${bowl.name}`)
    );
  }

  cancelDelete(bowl){
    console.log("cancel delete");
    bowl.deleting = false;
  }

}

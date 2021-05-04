import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { VisitorsService } from 'src/app/services/visitors.service';
import {
  NavController,
  AlertController,
  MenuController,
  ToastController,
  PopoverController,
  ModalController, 
  LoadingController,
  Platform} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Storage } from '@ionic/storage';
import { finalize } from 'rxjs/operators';
import { EmployeesService } from 'src/app/services/employees.service';
import { NgxSpinnerService } from "ngx-spinner";
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AceessLogService } from 'src/app/services/aceess-log.service';
import { QuestionnaireService } from 'src/app/services/questionnaire.service';
import { BadgeService } from 'src/app/services/badge.service';

const TOKEN_KEY = 'access_token';

@Component({
  selector: 'app-q-survey',
  templateUrl: './q-survey.page.html',
  styleUrls: ['./q-survey.page.scss'],
})
export class QSurveyPage implements OnInit {

  
  @Input() value: any;
  public info: any;
  personInfo: any;
  staff:any;
  employee:any;
  visitorInfo = null;
  isDataAvailable:boolean = false;
  temperatureForm: FormGroup;
  questionnaire:any;

  constructor(
    private sanitizer: DomSanitizer,
    public service: AceessLogService,
    public qService: QuestionnaireService,
    public bService: BadgeService,
    public navCtrl: NavController,
    public menuCtrl: MenuController,
    public popoverCtrl: PopoverController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public toastCtrl: ToastController,
    private helper: JwtHelperService, 
    private storage: Storage,
    private spinner: NgxSpinnerService,
    public employeeService: EmployeesService,
    private formBuilder: FormBuilder,
    private plt: Platform
  ) { 
    
  }

  async ngOnInit() {
    await this.getStaff();
    // await this.fetchInfo();

    this.info = this.sanitizer.bypassSecurityTrustStyle(this.value);
    this.personInfo = await JSON.parse(this.info.changingThisBreaksApplicationSecurity);
    
    this.getQuestionnaire();

    this.temperatureForm = this.formBuilder.group({
      temperature: ['', [Validators.required ]],
    });
  }

  async getStaff() {
    await this.storage.get(TOKEN_KEY)
      .then((token) => {

        if (token) {
          let decoded = this.helper.decodeToken(token);
          this.staff = decoded;
          console.log(this.staff)
        }

      });
  }

  getQuestionnaire(){
    this.qService.getQuestionnaire(this.personInfo.employee_id)
    .subscribe(res => {
      this.questionnaire = res;
      if(this.questionnaire.length == 0){
        this.notFound();
      }
    }, err => {
      console.log(err);
    });
  }

  async notFound() {
    const alert = await this.alertCtrl.create({
      header: 'Not Found',
      message: 'This questionnaire has not been found',
      buttons: [
         {
          text: 'Confirm',
          handler: async () => {

            this.closeModal();
      
          }
        }
      ]
    });

    await alert.present();
  }

  doRefresh(event) {
    setTimeout(() => {
      this.ngOnInit();
      event.target.complete();
    }, 2000);
  }

  // async fetchInfo() {
  //   this.info = this.sanitizer.bypassSecurityTrustStyle(this.value);

  //   const loader = await this.loadingCtrl.create({
  //     duration: 2000
  //   });

  //   loader.present();

  //   loader.onWillDismiss().then(async l => {
  //     this.personInfo = JSON.parse(this.info.changingThisBreaksApplicationSecurity);
  //   });
  // }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  async generateBadge() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmation',
      message: 'Generate access badge?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Confirm',
          handler: async () => {

            this.executeBadge();
            this.closeModal();

            const loader = await this.loadingCtrl.create({
              duration: 2000
            });

            loader.present();
            loader.onWillDismiss().then(async l => {
              const toast = await this.toastCtrl.create({
                showCloseButton: true,
                message: 'Access badge generated',
                duration: 2000,
                position: 'top'
              });

              toast.present();
            });
          }
        }
      ]
    });

    await alert.present();
  }

  executeBadge(){
    if(this.personInfo){
        this.visitorInfo = {employee_id: '', location: ''}
        
        this.visitorInfo.employee_id = this.personInfo.employee_id;
        this.visitorInfo.location = this.personInfo.location;

      this.bService.submit(this.visitorInfo).subscribe();
    }
  }

}

'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map, mapEvent;

class Workout{
    date = new Date();
    id = (Date.now()+ '').slice(-10);
  

    constructor(coords, duration, distance){
        this.coords = coords; //[lat, lng]
        this.duration = duration; // in min
        this.distance = distance; //in km 
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months [this.date.getMonth()]} ${this.date.getDate()} `
    
    }
 

}

class Cycling extends Workout{
    type = 'cycling'
    constructor(coords, distance, duration, elevationGain){
        super(coords, duration, distance);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
       
    }
    calcSpeed(){
        // Km/hr
        this.speed = this.distance/ (this.duration / 60 );
        return this.speed;
    }
   
}

class Running  extends Workout{
     type = 'running'
    constructor(coords, distance, duration, cadence){
        super(coords, duration, distance);
        this.cadence = cadence;
        this._setDescription()
        this.calcPace();
    }
    calcPace(){
        // min/km
        this.pace = this.duration / this.distance
        return this.pace;
    }
    
}

// APPLICATION ARCHITECTURE
class App{
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13;
    constructor(){
      //Get positon of user's
        this._getPosition();
        //Get the data from Local storage
        this._getLocalStorage();

        //Attach event handler
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change',this._toggleElevationField); 
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
       
    }

    _getPosition(){
        
    if(navigator.geolocation)
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
        alert('Could not get your position')
    });
    }
    
    _loadMap(position){
       
        const {latitude, longitude} = position.coords;
      
        console.log(`https://www.google.com/maps/place//@${latitude},${longitude}`);
        const coords = [latitude, longitude]
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        //Handling clicks on map
        this.#map.on('click', this._showForm.bind(this))
    }
    _showForm(mapE){

        this.#mapEvent = mapE;
        form.classList.remove('hidden')
        inputDistance.focus();
    }

    _hideForm() {
        // Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
          '';
    
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
      }
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')

    }
    _newWorkout(e){
       
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) =>inputs.every(inp => inp>0);
        e.preventDefault();
        
        //Get data from form

        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;
        
        //If workout running, create running object
        if(type ==='running'){
            const cadence = +inputCadence.value
             //Check if data is valid
              if(
                    !validInputs(distance, duration, cadence) ||
                    !allPositive(distance, duration, cadence)
                )
                return alert('Inputs have to be positive numbers!')
            workout = new Running([lat, lng],distance, duration, cadence);
            
        }
        //if workout cycling, create cycling object
        if(type ==='cycling'){
            const elevation = +inputElevation.value
              //Check if data is valid
              if(
                    !validInputs(distance, duration, elevation)||
                    !allPositive(distance, duration)
                ) 
                return alert('Inputs have to be positive numbers!')
            workout = new Cycling([lat, lng],distance, duration, elevation);
            
        }
        //Add new object to workout array
        this.#workouts.push(workout);
        
        //Render workout on map as marker 
        this._renderWorkoutMarker(workout)

       //Render workout on list
        this._rednerWorkout(workout)

        // Hide form + clear input fields
        this._hideForm();

      this._setLocalStroage();
    }

    //Display Marker
    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({maxwidth: 250, minwidth: 100,
            autoClose: false,
            closeOnClick: false,
            className : `${workout.type}-popup`
        }))
        .setPopupContent(
            `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
          )
        
        .openPopup();
    }  

    _rednerWorkout(workout){
        let html = 
        `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? '🏃‍♂️': '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
        if(workout.type === "running")
            html += `
             <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </
        li>
        `
        if(workout.type === "cycling")
            html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        `
        form.insertAdjacentHTML('afterend', html)
    }

    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
      
        if(!workoutEl) return;
        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
      
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            }
        });
     
    }

   _setLocalStroage(){
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));

   };

   _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    if(!data) return
    this.#workouts = data;
    this.#workouts.forEach(work => {
        this._rednerWorkout(work)
    })
   };
   reset(){
    localStorage.removeItem('workouts');
    location.reload();
   }
}

const app = new App();

'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

}
class Cycling extends Workout{
    type = 'cycling'
    constructor(coords, distance, duration, elevationGain){
        super(coords, duration, distance);
        this.elevationGain = elevationGain;
        // this.type = 'cycling'
        this.calcSpeed();
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
        // this.type = 'running'
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
    constructor(){
      
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change',this._toggleElevationField); 
    }

    _getPosition(){
        
    if(navigator.geolocation)
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
        alert('Could not get your position')
    });
    }
    
    _loadMap(position){
        console.log(this);
        const {latitude, longitude} = position.coords;
      
        console.log(`https://www.google.com/maps/place//@${latitude},${longitude}`);
        const coords = [latitude, longitude]
        this.#map = L.map('map').setView(coords, 13);
    
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
        this.renderWorkoutMarker(workout)

       //Render workout on list


        //Hide and clear input field
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    }

    //Display Marker
    renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({maxwidth: 250, minwidth: 100,
            autoClose: false,
            closeOnClick: false,
            className : `${workout.type}-popup`
        }))
        .setPopupContent(workout.type)
        .openPopup();
    }  
}

const app = new App();

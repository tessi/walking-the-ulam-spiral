/*
 * Now that I see you inspecting the code, I feel watched ;)
 * Please note that this code produced at night and has never
 * seen a linter, tests or browser compatibility checks.
 *
 * The idea is from @montyxcantsin -- I just did this visualization
 * as I found the work interesting.
 *
 * The Miller-Rabin implementation comes from rosettacode.
 * Every function with mostly single letter variables is from there ;)
 *
 * As I'm not a CSS-person, it was fun to see how easy it was
 * to align the triangle with flexbox.
 *
 * Feel free to open an issue with any hints or comments.
 * -- tessi
 */

const pauseAfterRowsParam = (new URL(location)).searchParams.get('pauseAfterRows');
const pauseAfterRows = Math.max(parseInt(pauseAfterRowsParam || '47'), 1);

const boxSizeParam = (new URL(location)).searchParams.get('boxSize');
const incrementBoxSizeParam = (new URL(location)).searchParams.get('incrementBoxSize');
const incrementBoxSize = Math.max(parseInt(incrementBoxSizeParam || '0'), 0);

const boxesToProcess = [];
var boxSize = Math.max(parseInt(boxSizeParam || '70'), 1);

// we incrementBoxSize before adding the first row, this way
// the user can control the first rows boxSize with the boxSize param
if (incrementBoxSize) { boxSize -= 1; }

var scheduledRows = 0;
var continueComputation = undefined;

var modProd = function(a,b,n) {
  if(b==0) return 0;
  if(b==1) return a%n;
  return (modProd(a,(b-b%10)/10,n)*10+(b%10)*a)%n;
};

var modPow = function(a,b,n) {
  if(b==0) return 1;
  if(b==1) return a%n;
  if(b%2==0){
    var c=modPow(a,b/2,n);
    return modProd(c,c,n);
  }
  return modProd(a,modPow(a,b-1,n),n);
};

// The Miller-Rabin implementation comes
// from the Rosetta-Code project:
// http://rosettacode.org/wiki/Miller-Rabin_primality_test#JavaScript
// nobody understands this code, but hey it's probably ported from perl :P
var isPrime = function(n) {
  if(n<2) return false;
  if(n==2||n==3||n==5) return true;
  if(n%2==0||n%3==0||n%5==0) return false;
  if(n<25) return true;

  for(var a=[2,3,5,7,11,13,17,19],b=n-1,d,t,i,x;b%2==0;b/=2);
  for(i=0;i<a.length;i++){
    x=modPow(a[i],b,n);
    if(x==1||x==n-1) continue;
    for(t=true,d=b;t&&d<n-1;d*=2){
      x=modProd(x,x,n); if(x==n-1) t=false;
    }
    if(t) return false;
  }
  return true;
};

function boxPrimarity(rowNumber, boxNumber, boxSize) {
  const boxCountOfPreviousRows = rowNumber * (rowNumber - 1) / 2;
  const highestCheckedNumber = boxCountOfPreviousRows * boxSize;
  const result = {
    numbers: {},
    primeCount: 0
  };

  for (var i = 0; i < boxSize; i++) {
    const numberTocheck = highestCheckedNumber + 1 + (i * rowNumber) + boxNumber;
    const primality = isPrime(numberTocheck, 50);
    result.numbers[numberTocheck] = primality;
    if (primality) {
      result.primeCount += 1;
    }
  }

  result.hasPrime = result.primeCount > 0;
  return result;
}

function fillBox(box) {
  const boxNumber = parseInt(box.dataset.box);
  const rowNumber = parseInt(box.parentElement.dataset.row);
  const result = boxPrimarity(rowNumber, boxNumber, boxSize);

  box.dataset.result = JSON.stringify(result);
  if (result.hasPrime) {
    box.classList.add('box--prime');
  } else {
    box.classList.add('box--no-prime');
  }
  box.style.color = '#123456'
}

function addRow() {
  const container = document.getElementById('container');
  const lastRowNumber = container.childElementCount;

  const newRowNumber = lastRowNumber + 1;
  const newRow = document.createElement('div');
  newRow.dataset.row = newRowNumber;
  newRow.classList.add('row');

  const newBoxes = [];
  for (var i = 0; i <= lastRowNumber; i++) {
    const newBox = document.createElement('div');
    newBox.dataset.box = i;
    newBox.classList.add('box');
    newBox.addEventListener('click', function(e) {
      showPopupForBox(newBox);
      e.stopPropagation();
    });
    newRow.appendChild(newBox);
    newBoxes.push(newBox);
  }
  container.appendChild(newRow);
  return newBoxes;
}

function processNextRow() {
  if (boxesToProcess.length === 0) { prepareNextRowForProcessing(); }
  if (shouldStopComputation()) { return showContinueButton(); }
  const nextBox = boxesToProcess.shift();
  fillBox(nextBox);

  window.requestAnimationFrame(processNextRow);
}

function prepareNextRowForProcessing() {
  scheduledRows += 1;
  boxesToProcess.push(...addRow());
  if (incrementBoxSize) { boxSize += incrementBoxSize; }
}

function shouldStopComputation() {
  // continueComputation is undefined when the user never
  // clicked a control-button
  return (
    continueComputation === undefined &&
      (scheduledRows > pauseAfterRows)
  ) || (
    continueComputation !== undefined &&
      !continueComputation
  )
}

function hidePopup() {
  const popup = document.getElementById('popup');
  popup.style.display = 'none';
}
document.body.addEventListener('click', hidePopup);

function showPopupForBox(box) {
  const popup = document.getElementById('popup');
  const result = JSON.parse(box.dataset.result);
  const list = document.createElement('ul');
  Object.keys(result.numbers).forEach(function(number) {
    const listItem = document.createElement('li');
    listItem.appendChild(document.createTextNode(`${number}: ${result.numbers[number] ? '' : 'not '}prime`));
    list.appendChild(listItem);
  });
  popup.innerHTML = '';
  if (result.hasPrime) {
    popup.appendChild(document.createTextNode('This box contains at least one prime'));
  } else {
    popup.appendChild(document.createTextNode('This box contains no prime'));
  }
  popup.appendChild(list);

  const top = box.getBoundingClientRect().top + window.pageYOffset - box.ownerDocument.documentElement.clientTop;
  const left = box.getBoundingClientRect().left + window.pageXOffset - box.ownerDocument.documentElement.clientLeft;
  popup.style.display = 'block';
  popup.style.top = `${top}px`;
  popup.style.left = `${left + 10}px`;
}

function saveAsSvg() {
  html2canvas(document.getElementById('container')).then(function(canvas) {
    const url = `data:${canvas.toDataURL('image/png')}`;
    const link = document.createElement('a');
    link.download = 'daena.png';
    link.href = url;
    link.style = 'display: none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // On Edge, revokeObjectURL should be called only after
    // a.click() has completed, atleast on EdgeHTML 15.15048
    setTimeout(function() {
        window.URL.revokeObjectURL(url);
    }, 1000);
  });
}

const playButton  = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const saveButton  = document.getElementById('saveButton');

function showContinueButton() {
  playButton.style.display = 'block';
  pauseButton.style.display = 'none';
}

function showPauseButton() {
  playButton.style.display = 'none';
  pauseButton.style.display = 'block';
}

function initializeControls() {
  playButton.addEventListener('click', function() {
    showPauseButton();
    continueComputation = true;
    window.requestAnimationFrame(processNextRow);
  });
  pauseButton.addEventListener('click', function() {
    showContinueButton();
    continueComputation = false;
  });
  saveButton.addEventListener('click', saveAsSvg);
}

initializeControls();
processNextRow();

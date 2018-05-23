const numbersInCellParam = (new URL(location)).searchParams.get('boxSize');
const numbersInCell = Math.max(parseInt(numbersInCellParam || '70'), 1);

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
  const result = { numbers: {} };

  for (var i = 0; i < boxSize; i++) {
    const numberTocheck = highestCheckedNumber + 1 + (i * rowNumber) + boxNumber;
    const primality = isPrime(numberTocheck, 50);
    result.numbers[numberTocheck] = primality;
    result['hasPrime'] = result['hasPrime'] || primality;
  }

  return result;
}

function fillBox(box) {
  const boxNumber = parseInt(box.dataset.box);
  const rowNumber = parseInt(box.parentElement.dataset.row);
  const result = boxPrimarity(rowNumber, boxNumber, numbersInCell);

  box.dataset.result = JSON.stringify(result);
  if (result.hasPrime) {
    box.classList.add('box--prime');
  } else {
    box.classList.add('box--no-prime');
  }
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

const boxesToProcess = [];

function processNextRow() {
  if (boxesToProcess.length === 0) {
    boxesToProcess.push(...addRow());
  }

  const nextBox = boxesToProcess.shift();
  fillBox(nextBox);

  window.requestAnimationFrame(processNextRow);
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

processNextRow();

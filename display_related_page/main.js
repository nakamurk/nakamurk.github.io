const target = /https:\/\/learn.microsoft.com\//

const from = "ja-jp"
const to = "en-us"
const pad = "35%"
const key2 = "KeyM"

if (target.test(location.href) ) {
  const iframe = document.createElement('iframe')
  document.body.prepend(iframe)
  iframe.id = 'display_related_page'
  iframe.src = location.href.replace(from, to)
  iframe.width = document.body.clientWidth
  iframe.height = "40%"
  iframe.style.position = 'fixed'
  iframe.style.top = 0
  iframe.style.zIndex = 20

  document.body.style.paddingTop = pad
  document.body.style.zIndex = 10
}

document.addEventListener('keydown', keydownEvent, false)
let toggle = 0
function keydownEvent(event){
  let iframe = document.getElementById("display_related_page")
  if(event.ctrlKey) {
    if(event.code === key2) {
      if ((toggle++) % 2 == 1) {
          iframe.style.visibility = "visible"
          document.body.style.paddingTop = pad
      } else {
          iframe.style.visibility = "hidden"
          document.body.style.paddingTop = "0%"
      } 
    }
  }
}


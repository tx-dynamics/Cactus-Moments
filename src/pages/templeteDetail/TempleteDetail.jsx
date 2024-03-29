import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  arrowBack,
  arrowDown,
  arrowDownTwo,
  dummyOne,
  dummyThree,
  dummyTwo,
  dummyWithBg,
  edit,
} from "../../assets";
import {
  ChooseBackgroundModel,
  CompositionModel,
  CustomInputWithDropdown,
  DropdownModel,
  Footer,
  GenderModel,
  DefaultModel,
  PaymentModel,
  NavBar,
  TempleteView,
} from "../../components";
import { req, getKey, setKey } from '../../requests'

import { logo } from "../../assets";
import { getAllParams, setParam } from "../../urlParams";
import "./templeteDetail.css";
import { getImageSize } from "react-image-size";
import html2canvas from 'html2canvas';
import swal from "sweetalert";

const CONSTANT_BOTTOM_OFFSET = 0
let renderCanvas = true

const renderText = (context, name, xText, yText, textSize, font, color) => {

}

function random(seed) {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const fontAPI = 'AIzaSyAWrXbPuJpa4VLfqfjmVHGy4M2DG-y4cj4';

const sdbm = str => {
  let arr = str.split('');
  return arr.reduce(
    (hashCode, currentVal) =>
      (hashCode =
        currentVal.charCodeAt(0) +
        (hashCode << 6) +
        (hashCode << 16) -
        hashCode),
    0
  );
}

const shuffleSeed = (seed) => (n, array) => {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random(sdbm(seed)) * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  array.forEach((x, i) => array[i] = x ? x : array[Math.floor(Math.random()*array.length)])
  return array
}

const getCharacters = cat => cat.subcategories.map(sub => sub.characters).reduce((a, b) => a.concat(b)).fit(0, parseInt(cat.max))
const getCategoryCharacters = product => product.categories.map(cat => getCharacters(cat)).reduce((a, b) => a.concat(b), []).fit(0, product.categories.map(cat => parseInt(cat.max)).reduce((a, b) => a + b, 0))

const getCharactersGivenStatic = cat => cat.subcategories.map(sub => sub.characters).reduce((a, b) => a.concat(b)).fit(0, parseInt(cat.modifiedMax ?? cat.max))
const getCategoryCharactersGivenStatic = product => product.categories.map(cat => getCharactersGivenStatic(cat)).reduce((a, b) => a.concat(b), []).fit(0, product.categories.map(cat => parseInt(cat.max)).reduce((a, b) => a + b, 0))

const groupPricing = pricings_ => {
  let pricings = pricings_ ?? []
  const pricingSections = {}
  for(const p of pricings) pricingSections[p.section] = []
  for(const p of pricings) pricingSections[p.section].push(p)
  return pricingSections
}

const srandom = (str, i=0) => random(sdbm(str)+i)

class ObjectRewriter {
  constructor(rewriter){
      this.requiresArgument = true
      this.rewriter = rewriter
  }

  rewrite(data){
      const obj = {...data}
      for(const k in this.rewriter){
          const rewriter = this.rewriter[k]
          if (k in data){
              const val = data[k]
              const rewritten = rewriter.rewrite(val)
              obj[k] = rewritten
          } else {
              if (!rewriter.requiresArgument) obj[k] = rewriter.rewrite(null)
              else throw "No rewrite possible"
          }
      }
      return obj
  }
}

class RewriterFunction extends ObjectRewriter {
  constructor(f, constant=true){
      super(null, null)
      this.requiresArgument = constant
      this.fun = f
  }

  rewrite(data){
      return this.fun(data)
  }
}

class WholeArrayRewriter extends ObjectRewriter {
  constructor(pattern){
      super(null, null)
      this.patternVar = pattern
  }

  rewrite(arr){
      let objs = []
      for(const i in arr){
          objs.push(this.patternVar.rewrite(arr[i]))
      }
      return objs
  }
}

class TupleRewriter extends ObjectRewriter {
  constructor(pattern){
      super(pattern, null)
  }

  rewrite(arr){
      let new_arr = []
      for(const i in this.rewriter){
          const pattern = this.rewriter[i]
          const elem = arr[i]
          new_arr.push(pattern.rewrite(elem))
      }
      return new_arr
  }
}

function fromObject(obj){
  let newObj = {}
  for(const k in obj){
      const v = obj[k]
      if (v instanceof Array) newObj[k] = Const(v)
      else if (v instanceof Object) newObj[k] = fromObject(v)
      else {
          newObj[k] = Const(v)
      }
  }
  return Rewriter(newObj)
}

const Id = () => new RewriterFunction(a => a)
const Const = x => new RewriterFunction(_ => x, false)
const Fun = f => new RewriterFunction(f)
const FunConst = f => new RewriterFunction(f, true)
const Rewriter = pattern => new ObjectRewriter(pattern)
const Arr = patternVar => new WholeArrayRewriter(patternVar)
const Tup = arr => new TupleRewriter(arr)
const Cond = (c, t, e) => new RewriterFunction(x => c.match(x) ? t.rewrite(x) : e.rewrite(x))

class Tags {
  constructor(){
      this.tags = {
          radius: 20,
          fillStyle: '#22cccc',
          strokeStyle: '#009999',
          selectedFill: '#88aaaa',
          sprite: '',
          text: {
              text: "",
              textBaseline: "middle",
              font: "20px Arial",
              textAlign: "middle",
              fillStyle: "red"
          } 
      }
  }

  override(rewriter=Rewriter({})){
      return rewriter.rewrite(this.tags)
  }
}

class VisualizationGraph {
  constructor(nodes=[], edges=[], context, textNodes=[]){
    this.context = this.context
    this.textNodes = textNodes
    this.nodes = nodes
    this.edges = edges
    this.drawer = new GraphDrawer(this, context)
  }

  createNode(x, y, tags={}) {
      return {
          selected: false,
          ...tags
      }
  }

  within(x, y){ 
      return this.nodes.find(n => 
          x > (n.x - n.radius) && 
          y > (n.y - n.radius) &&
          x < (n.x + n.radius) &&
          y < (n.y + n.radius)
      )
  }

  addNode(x, y, tags={}, shouldDraw=true) {
      const el = document.getElementById('canvas').getBoundingClientRect()
      x = x || tags.x
      y = y || tags.y

      const p = {x, y}
      // x = x >= el.width ? el.width-50-randBetween(0, 30) : x
      // y = y >= el.height ? el.height-50-randBetween(0, 500) : y
      tags.x = x
      tags.y = y
      const node = this.createNode(x, y, tags)
      this.nodes.push(node)
      if(shouldDraw) this.drawer.draw()
      return node
  }

  addEdge(selection, target) {
      const edge = {from: selection, to: target}
      let shouldRet = false
      if (selection && selection !== target) {
          shouldRet = true
          this.edges.push(edge)
      }
      this.drawer.draw()
      return shouldRet ? edge : null
  }

  addTextNode(name, obj) {
    this.textNodes.push({name, tags: obj})
    this.drawer.draw()
  }
}

class GraphDrawer {
  constructor(graph, context){
    this.context = context
    this.graph = graph
    this.selection = null
  }

  draw() {
    const context = this.context
    const el = document.getElementById('canvas').getBoundingClientRect()
    context.clearRect(0, 0, el.width, el.height)

    this.graph.edges.map(edge => {
        const fromNode = edge.from
        const toNode = edge.to
        context.beginPath()
        context.strokeStyle = fromNode.strokeStyle
        context.strokeStyle = "red"
        context.lineWidth = 2
        context.shadowOffsetX = 4
        context.shadowOffsetY = 4
        context.shadowBlur = 5
        context.shadowColor = "gray"
        context.moveTo(fromNode.x, fromNode.y)
        context.lineTo(toNode.x, toNode.y)
        context.stroke()
    })

    let renderedNodes = 0
    const sortedNodes = this.graph.nodes.sort((a, b) => parseInt(a.layer) > parseInt(b.layer) ? 1 : -1)
    sortedNodes.map(node => {
      var img = new Image();
      const self = this
      img.onload = function () {
        const specifiedRatio = node.scale == 0 ? 1 : node.scale/100

       context.webkitImageSmoothingEnabled = true;
        context.mozImageSmoothingEnabled = true;
        context.imageSmoothingEnabled = true;
        // drawImage(context, node.sprite, this.width * specifiedRatio, this.height * specifiedRatio)
        context.drawImage(img, node.x, node.y, this.width * specifiedRatio, this.height * specifiedRatio);

        // renderedNodes += 1
        renderedNodes = self.graph.nodes.length
        if(renderedNodes == self.graph.nodes.length) {
          self.graph.textNodes.map(node => {
            const {textSize, xText, yText, font, color} = node.tags
            const name = node.name
            renderText(self.context, name, xText, yText, textSize, font, color)
          })
        }
      };
      img.src = node.sprite
      // img.crossOrigin = "Anonymous"
    })
  }

  onmousemove(e) {
      if (this.selection && e.buttons) {
          this.selection.x = e.x
          this.selection.y = e.y
          this.draw()
      }
  }

  onmousedown(e) {
      let target = this.graph.within(e.x, e.y)
      if (this.selection && this.selection.selected) {
          this.selection.selected = false
      }
      if (target) {
          // this.graph.addEdge(this.selection, target)
          this.selection = target
          this.selection.selected = true
          this.draw()
      }
  }

  onmouseup(e){
      if (!this.selection) this.graph.addNode(e.x, e.y, new Tags().override())
      if (this.selection && !this.selection.selected) this.selection = null
      this.draw()
  }
}

const findIndex = (f, arr) => {
  for(let i = 0; i < arr.length; i++)
    if(f(arr[i])) return i
  return -1
}

function doElementsIntersect(element1, element2) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  // Check for intersection
  const isIntersecting = !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );

  return isIntersecting;
}

const productPositions = product => {
  const productNMax = product.categories?.map(x => parseInt(x.max ?? 0) ?? 0)?.reduce((a, b) => a+b, 0)
  const arr = product.categories
      .map(cat => new Array(parseInt(cat.max ?? 0) ?? 0).fill(cat))
      .map(arr => arr.map((cat, i) => cat?.subcategories?.[0]?.characters?.[0]))
      .reduce((a, b) => [...a, ...b], [])
      .slice(0, productNMax)
  const nameArr = product.categories
      .map(cat => new Array(parseInt(cat.max ?? 0) ?? 0).fill(cat))
      .map(arr => arr.map((cat, i) => [cat?.name, i+1]))
      .reduce((a, b) => [...a, ...b], [])
      .slice(0, productNMax)
  const categoryArr = product.categories
      .map(cat => new Array(parseInt(cat.max ?? 0) ?? 0).fill(cat))
      .map(arr => arr.map(cat => cat?.categoryScale))
      .reduce((a, b) => [...a, ...b], [])
      .slice(0, productNMax)

  const poses = product.backgrounds[0]?.positions?.slice(0, productNMax)?.map((pos, i) => ({x: pos[0], y: pos[1], categoryScale: categoryArr[i] ?? 0, scale: pos[3], name: nameArr[i], isStatic: pos[5] != undefined && pos[5] != 0, staticAssociation: pos[5] != undefined ? nameArr[i] : null}) ?? [])
  return poses
}

const hasStaticPositions = product => {
  const positions = productPositions(product)
  return positions.map((x, i) => x.isStatic ? i : null).filter(x => x != null).length != 0
}


const accImageIndexes = (hiddenCats, arg) => {
  let i = 0
  const newArr = arg.map(([cat, images]) => {
    return [
      cat, 
      images.map(([image, _]) => {
        const res = [image, i]
        i += 1
        return res
      })
    ]
  })
  return newArr
}

const makeRepeatedArray = (arr, l) => {
  const newArr = []
  let j = 0
  for(const i of new Array(l).fill(0).map((_, i) => i)) {
      if(j >= arr.length) j = 0
      const el = arr[j]
      newArr.push(el)
      j++
  }
  return newArr
}

Array.prototype.fit = function (a, b, c, d) {
  const args = [a, b, c, d]
  if(a == 0 && c == undefined && d == undefined) {
    if(b > this.length) return makeRepeatedArray(this, b)
    else return this.slice(...args)
  } else return this.slice(...args)
}

const groupDistribution = (ogProduct, arr) => {
  const iArr = arr
  // findProductPositionIndexes(ogProduct).forEach(i => iArr[i] = )
  return [iArr]
}

const arrangeByParent = arr => {
  const parentArrangement = {}
  const parents = []

  for(const el of arr) if(!el.parent) el.parent = ''
  for(const el of arr) parentArrangement[el.parent] = []
  for(const el of arr)
    if(el.parent) parentArrangement[el.parent].push(el)
    else parents.push(el)

  const parentChildArray = parents.map(p => [p, ...(parentArrangement[p.title] ?? [])]).reduce((a, b) => [...a, ...b], [])
  return parentChildArray
}

const screenshot = async ref => {
  // Select the element that you want to capture
  const captureElement = ref;

  // Call the html2canvas function and pass the element as an argument
  const canvas = await html2canvas(captureElement)
  // Get the image data as a base64-encoded string
  const imageData = canvas.toDataURL("image/png");

  // Do something with the image data, such as saving it as a file or sending it to a server
  // For example, you can create an anchor element and trigger a download action
  return imageData
}

const TitleComponent = ({ elementId, givenId, background, title, style }) => {
  const hiddentitleCentricEl = document.querySelector(`#${elementId} > div`)
  const ogValue = hiddentitleCentricEl.innerHTML
  hiddentitleCentricEl.innerHTML = title
  // const hiddentitleCentricEl = overlayTitleHidden?.current
  if(!hiddentitleCentricEl) return <></>

  const halfTitleLen = Math.round(title.length/2)
  const [titleFirstHalf, titleSecondHalf] = [title.slice(0, halfTitleLen), title.slice(halfTitleLen)]
  const width = hiddentitleCentricEl.getBoundingClientRect().width
  const singleCharWidth = width/title.length
  const widthHalf = width/2
  const computedLeftX = background.coordinateVariation.xText - widthHalf
  const computedMainX = background.coordinateVariation.xText

  hiddentitleCentricEl.innerHTML = ogValue

  console.log("COMPUTED-AXIS", width, widthHalf, computedLeftX, computedMainX)
  return <div className={givenId} id={givenId} style={{
    zIndex: 100000000,
    // height: "500px", 
    // width: "500px", 
    whiteSpace: 'nowrap',
    position: "absolute", 
    // left: `${background.coordinateVariation.xText}px`, 
    top: `${background.coordinateVariation.yText}px`,
    fontSize: `${background.coordinateVariation.textSize}pt`,
    fontFamily: background.font,
    color: background.coordinateVariation.color,
    display: "flex",
    ...(style ? style : {})
  }}>
    <p style={{ position: "absolute", left: `${computedLeftX}px` }}>{title}</p>
    {/* <p style={{ position: "absolute", left: `${computedMainX}px` }}>{titleSecondHalf}</p> */}
  </div>
}

const decodeOffsets = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [decodeURIComponent(k), v]))

const makeSpriteModification = img => {
  console.log("IMG>>", img)
  if(!img) return null
  const url = "https://drivebuddyz.s3.us-east-2.amazonaws.com/"
  const [_, rest] = img.split(url)
  return url + encodeURIComponent(rest)
}

const getTotalOffset = url => {
  const el = [...document.getElementsByClassName(url)][0]
  if(!el) return {}
  return el.getBoundingClientRect()
}

const NestedDescription = ({
  setShowModalDes,
  img,
}) => {
  // Set a minimum height for the modal
  const minHeight = 250;
  const maxHeight = 600;
  const descriptionHeight = 500;
  return (
    <div
      onClick={() => setShowModalDes(null)}
      className="add-product-modal-main-container-video"
    >
      <div
        className="add-product-modal-container-product-description-detail-video"
      >
        {/* <h1>Description</h1> */}
          <img className="video-model"
            // url={currentVideo.photo}
            src={img}
          />
      </div>
    </div>
  );
}

const splitByNumOfChars = (str, n) => {
  console.log("ARROFSUBTITLE-str", str)
  const chunks = [];
  const charsLength = str.length
  let current = ""

  for (var i = 0; i < charsLength; i += n) {
      chunks.push(str.substring(i, i + n));
  }

  return chunks
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

const isPhone = () => getWindowDimensions().width < 421  

function paginate(array, page_size, page_number) {
  return array.slice((page_number - 1) * page_size, page_number * page_size);
}

let firstLoad = true

// const getInitialCategoryObject = product => {
//   const positionObject = {}
//   for
// }

const getCategoryOfCharacter = (product, sprite) => {
  const foundCategory = product?.categories?.find(
    cat => 
      cat?.subcategories?.map(sc => sc?.characters).flat().includes(sprite) || 
      cat?.subcategories?.map(sc => sc?.characters).flat().includes(encodeURIComponent(sprite)) ||
      cat?.subcategories?.map(sc => sc?.characters).flat().includes(makeSpriteModification(sprite))
  )
  const foundSubcategory = product?.subcategories?.find(
    sub => sub?.characters?.includes(sprite) || 
      sub?.characters?.includes(encodeURIComponent(sprite)) ||
      sub?.characters?.includes(makeSpriteModification(sprite))
  )

  return [foundCategory, foundSubcategory]
}

// const findCharacterPositi

function TempleteDetail({ ogProduct, setOgProduct, JSONProduct, recents }) {
  const navigate = useNavigate();
  const overlayTitleHidden = useRef(null)
  const overlaySubtitleHidden = useRef(null)
  const [errorModal, setErrorModal] = useState(null)
  const [product, setProduct] = useState(Object.freeze(JSON.parse(JSONProduct)))
  console.log("navi", product.mainDesc)
  const [distribution, setDistribution] = useState([])

  const localDict = localStorage.getItem('backgrounds') ?? '{}'
  const dict = JSON.parse(localDict)

  const [background, setBackground] = useState(product.backgrounds[product.defaultBackground])
  const [alternateBackground, setAlternateBackground] = useState(product?.backgrounds?.find(bg => bg?.coordinateVariation?.evenFor == background?.url))
  const [title, setTitle] = useState(product.name)
  const [subtitle, setSubtitle] = useState(product.subtitle)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [showFrameModel, setShowFrameModel] = useState(false);
  const [showDimensionModel, setShowDimensionModel] = useState(false);
  const [showEditNameDropdown, setShowEditNameDropdown] = useState(false);
  const [showEditBackgroundDropdown, setShowEditBackgroundDropdown] =
    useState(false);
  const [showEditAdultDropdown, setShowEditAdultDropdown] = useState(undefined);
    useState(false);
  const [familyCompositionModel, setFamilyCompositionModel] = useState(false);
  const [chooseBackgroundModel, setChooseBackgroundModel] = useState(false);
  const [pricingObject, setPricingObject] = useState(groupPricing(product.pricing));
  const [selectedPricingOptions, setSelectedPricingOptions] = useState(Object.fromEntries(Object.entries(groupPricing(product.pricing)).map(([k, v]) => [k, v?.[0]])))
  const [shownPricingOptions, setShownPricingOptions] = useState(Object.fromEntries(Object.entries(groupPricing(product.pricing)).map(([k, v]) => [k, false])))
  const [chooseGenderModel, setChooseGenderModel] = useState(undefined);
  const [defaultModel, setDefaultModel] = useState(true);
  const [characters, setCharacters] = useState([])
  const [characterCategoryObject, setCharacterCategoryObject] = useState({})
  const [selectedFrame, setSelectedFrame] = useState({
    id: 1,
    name: `Sans Cadre ${product.frame1Price ? `(${product.frame1Price} €)` : ""}`,
    price: product.frame1Price ?? 0,
  });
  const [selectedDimension, setSelectedDimesion] = useState({
    id: 1,
    name: `Poster A3 - (29,7 x 42 cm) ${product.a3Price ? `(${product.a3Price} €)` : ""}`,
    price: product.a3Price ?? 0,
  });

  const [sideTempleArray, setSideTempleArray] = useState((product.previews ?? []).map((x, id) => { return { id, image: {url: x} } }));
  const [templeteArray, setTemplateArray] = useState([]);
  const [autoSelect, setAutoSelect] = useState(true)
  const [chosen, setChosen] = useState(false)

  const [ratios, setRatios] = useState(new Set())
  const [offsets, setOffsets] = useState({})
  const [realOffsets, setRealOffsets] = useState({})
  const [selectedImage, setSelectedImage] = useState(null)

  const [showPaymentModel, setShowPaymentModel] = useState(null)
  const [withCard, setWithCard] = useState(false)
  const [hiddenCentralCategories, setHiddenCentralCategories] = useState({})

  const getSegments = (y, subtitleMaxChars, subtitle, elementId) => {
    const subtitles = splitByNumOfChars(subtitle ?? "", subtitleMaxChars)
    const subtitleHiddenEl = document.querySelector(`#${elementId} > div`)
    if(!subtitleHiddenEl) return null
    const { height } = subtitleHiddenEl.getBoundingClientRect()
    console.log("ARROFSUBTITLEooo", subtitles, height)
    const finalPosition = y
    const subtitleSegments = [...subtitles].reverse().map((seg, i) => ({
      text: seg,
      position: finalPosition - i*height
    })).reverse()

    return subtitleSegments
  }

  const MultiText = ({ background }) => {

    const titleSegments = getSegments(parseInt(background.coordinateVariation.yText), 100_000, title, "overlay-title-hidden")
    const subtitleSegments = getSegments(parseInt(background.coordinateVariation.ySmallText), parseInt(background.coordinateVariation.smallTextMax ?? "80"), subtitle, "overlay-subtitle-hidden")
    if(!subtitleSegments) return <></>
    if(!titleSegments) return <></>

    const dist = parseInt(background.coordinateVariation.ySmallText) - parseInt(background.coordinateVariation.yText)

    console.log("DISTN", parseInt(background.coordinateVariation.ySmallText), parseInt(background.coordinateVariation.yText), dist)

    return <>
      <div id="title-container" style={{ position: "absolute" }}>
        {titleSegments.map(({ text: title, position }) => <TitleComponent title={title} background={background} elementId="overlay-title-hidden" givenId="overlay-title" style={{ top: `${subtitleSegments[0]?.position - dist}px` }}/>)}
      </div>
      <div id="subtitle-container" style={{ position: "absolute" }}>
        {subtitleSegments.map(({ text: subtitle, position }) => <TitleComponent title={subtitle} background={background} elementId="overlay-subtitle-hidden" givenId="overlay-subtitle" style={{
          whiteSpace: 'nowrap',
          position: "absolute", 
          // _: console.log("ARROFSUBTITLE-height", height, offset, background.coordinateVariation.ySmallText + offset),
          left: `${background.coordinateVariation.xSmallText}px`, 
          // top: `${parseInt(background.coordinateVariation.ySmallText) + offset}px`,
          top: `${position}px`,
          fontSize: `${background.coordinateVariation.smallTextSize}pt`,
          fontFamily: background.smallFont,
          color: background.coordinateVariation.smallColor,
        }}/>)}
      </div>
    </>
  }

  const editData = async () => {
    const ratios = new Set()
    for(const background of product.backgrounds) {
      const {height, width} = await getImageSize(background.url)
      const ratio = height/width
      if(ratio >= 1.1 && ratio <= 1.5) ratios.add(background.url)
    }
    // setTitle(product.name)
    // setSubtitle(product.subtitle)
    console.log("PREVIEWS", product.previews)
    setSideTempleArray((product.previews ?? []).map((x, id) => { return { id, image: {url:x} } }))
    setRatios(ratios)
  }

  useEffect(() => {
    const calculatedOffsets = {}
    console.log("MXC", groupDistribution(ogProduct, distribution).flat(1))
    for(const ch of groupDistribution(ogProduct, distribution).flat(1)) {
      console.log("STRING >>", ch, ch?.sprite)
      const img = ch?.sprite
      const el = document.querySelector(`[src="${img}"]`)
      if(el) {
        const { height } = el.getBoundingClientRect()
        console.log("IAMHERE!", height)
        calculatedOffsets[img] = height+CONSTANT_BOTTOM_OFFSET
      } else {
        calculatedOffsets[img] = 0
      }
    }
    console.log("OFFSET-VALUE-X", calculatedOffsets)
    setOffsets(calculatedOffsets)
    console.log("OFFSET >=>", calculatedOffsets)
  }, [title, subtitle, product, characters, distribution, background])

  useEffect(() => {
    setAlternateBackground(product?.backgrounds?.find(bg => bg?.coordinateVariation?.evenFor == background?.url))
  }, [background])

  useEffect(() => {
    editData().then(_ => console.log(_))

    // Setting the required states
    // setSideTempleArray((product.previews ?? []).map((x, id) => { return { id, image: {url: x} } }))
    console.log("SPRITES-NOW", distribution, characters)
    const containsStatic = hasStaticPositions(product)

    const charPositions = {}
    const ogChars = getCategoryCharacters(product)
    let newChars = ogChars
      // .slice(0, newChars.length - diff - 1)
      .map((ch, i) => {
        const [cat] = getCategoryOfCharacter(product, ch)
        const catName = cat.name
        const curr = charPositions[catName] ?? 0
        const catDists = distribution.filter(cat => cat.categoryName == catName)
        const currDist = catDists[curr]
        // if(curr >= parseInt(cat.modifiedMax)) return ch
        charPositions[catName] = curr + 1
        if(!currDist) return ch
        return currDist?.sprite
      })
      console.log("chs", charPositions)
    // if(containsStatic) setCharacters(getCategoryCharacters(product))
    // else setCharacters(newChars)
    console.log("CHs", firstLoad, characters, newChars)
    // if(containsStatic) setCharacters(ogChars)
    // else setCharacters(newChars)
    setCharacters(newChars)
  }, [product])

  useEffect(() => {
    if(recents == 'no') {
      const newBackgrounds = {...dict}
      newBackgrounds[product._id] = background
      localStorage.setItem('backgrounds', JSON.stringify(newBackgrounds))
    }
  }, [background])

  useEffect(() => {
    if(recents == 'no') setBackground(
        product.backgrounds.find(x => {return x?.url == dict[product._id].url}) ? product.backgrounds.find(x => x?.url == dict[product._id].url) : product.backgrounds[product.defaultBackground]
    ) 
  }, [product])

  useEffect(() => {
    if(!chosen) return

    let staticSeenCounters = {}
    const hiddenCentralCategories = {}
    const categoryCounters = {}
    const processBg = background => background.positions.map((pos, i) => {
      const cat = product.categories.find(cat => cat.name == positions[i]?.name?.[0])
      const hasSeen = staticSeenCounters[cat?.name] >= parseInt((cat?.modifiedMax ?? cat?.max) ?? '0')
      staticSeenCounters[cat?.name] = staticSeenCounters[cat?.name] ?? 0
      const hidden = hasSeen && hasStaticPositions(ogProduct) ? true : cat?.hidden

      console.log("DIST01-PROTO", cat?.name, cat?.hidden, parseInt(cat?.modifiedMax ?? '0'), staticSeenCounters[cat?.name])

      const catCounter = categoryCounters[`${cat?.name}`] ?? 0
      hiddenCentralCategories[`${cat?.name} ${(categoryCounters[`${cat?.name}`] ?? 0) + 1}`] = hidden
      categoryCounters[`${cat?.name}`] = catCounter + 1
      const ret = {
        x: pos[0],
        y: pos[1],
        ogSubcategoryName: product?.ogSubcats?.[`${pos[0]},${pos[1]}`],
        rectHeight: product?.positionalRects?.[`${pos[0]},${pos[1]}`],
        rectWidth: product?.positionalWidths?.[`${pos[0]},${pos[1]}`],
        layer: pos[2],
        scale: pos[3],
        hidden,
      }

      if(staticSeenCounters[cat?.name]) staticSeenCounters[cat?.name] += 1
      else staticSeenCounters[cat?.name] = 1

      return ret
    }).fit(0, product.categories.map(x => parseInt(x.max)).reduce((a, b) => a + b, 0))

    const sprites = characters
    const positions = productPositions(ogProduct)
    const alternateBackgroundNow = alternateBackground ?? product?.backgrounds?.find(bg => bg?.coordinateVariation?.evenFor == background?.url)
    let distribution = processBg(background)
    if(distribution.length % 2 == 0 && alternateBackgroundNow) distribution = processBg(alternateBackgroundNow)
    console.log("DISTRIBUTIN-NUMS", distribution.length, alternateBackgroundNow, distribution.length % 2 == 0 && alternateBackgroundNow)

    // console.log("DIST00", product.categories.map(x => parseInt(x.max)), distribution)
    // middling algorithm
    console.log("SPRITES", distribution)
    const spritedDistribution = distribution.map((x, i) => {
      const sprite = sprites[i]
      const { product: JSONProduct } = getAllParams()
      const ogProduct = JSON.parse(JSONProduct)
      const foundCategory = ogProduct?.categories?.find(
        cat => 
          cat?.subcategories?.map(sc => sc?.characters).flat().includes(sprite) || 
          cat?.subcategories?.map(sc => sc?.characters).flat().includes(encodeURIComponent(sprite)) ||
          cat?.subcategories?.map(sc => sc?.characters).flat().includes(makeSpriteModification(sprite))
      )
      const foundSubcategory = foundCategory?.subcategories?.find(
        sub => sub?.characters?.includes(sprite) || 
          sub?.characters?.includes(encodeURIComponent(sprite)) ||
          sub?.characters?.includes(makeSpriteModification(sprite))
      )
      const foundParent = foundCategory?.subcategories?.find(sub => sub?.name == foundSubcategory?.parent)
      const foundFirstChild = foundCategory?.subcategories?.find(sub => sub?.parent == foundSubcategory?.name)

      let categoryScale = foundSubcategory?.categoryScale
      let fixedOffset = foundSubcategory?.fixedOffset
      let fixedWidth = foundSubcategory?.fixedWidth
      let categoryLayer = foundSubcategory?.layer

      if(!categoryScale) categoryScale = foundParent?.categoryScale
      if(!categoryLayer) categoryLayer = foundParent?.layer
      if(!fixedOffset) fixedOffset = foundParent?.fixedOffset
      if(!fixedWidth) fixedWidth = foundParent?.fixedWidth

      if(!categoryScale) categoryScale = foundFirstChild?.categoryScale ?? 0
      if(!fixedOffset) fixedOffset = foundFirstChild?.fixedOffset ?? 0
      if(!fixedWidth) fixedWidth = foundFirstChild?.fixedWidth ?? 0

      console.log(
        "FINDCATEGORY-urix",
        hiddenCentralCategories
      )
      return { 
        ...x, 
        ogscat: foundSubcategory,
        ogparent: foundParent,
        categoryLayer,
        subcategoryName: foundSubcategory?.name, 
        fixedOffset,
        fixedWidth,
        categoryName: foundCategory?.name, 
        categoryScale, 
        offset: product?.offsets?.[foundCategory?.name], 
        offsetWidth: product?.offsetWidths?.[foundCategory?.name], 
        hidden: x.hidden,
        // offset: getTotalOffset(sprite).height, 
        // offsetWidth: getTotalOffset(sprite).width, 
        sprite: sprite,
      }
    })
    
    const nulls = spritedDistribution.filter(({sprite}) => !sprite)
    const actuals = spritedDistribution.filter(({sprite}) => !!sprite)

    const len = Math.round(nulls.length/2)
    const nulls1 = nulls.fit(0, len)
    const nulls2 = nulls.fit(len, nulls.length)

    const finalDistribution = [...nulls1, ...actuals, ...nulls2]

    // finalDistribution.forEach(({x, y, sprite, layer, scale}, i) => graph.addNode(null, null, new Tags().override(fromObject({x, y, layer, sprite, scale}))));

    const bg = background
    const font = bg.font
    const smallFont = bg.smallFont
    const variation = bg.coordinateVariation
    const {textSize, xText, yText, smallTextSize, xSmallText, ySmallText, color, smallColor} = bg.coordinateVariation
    // graph.addTextNode(title, {textSize, xText, yText, color, font})
    // graph.addTextNode(subtitle, {textSize: smallTextSize, xText: xSmallText, yText: ySmallText, color: smallColor, font: smallFont})
    console.log("DIST01", sprites, finalDistribution.filter(d => !d.hidden))
    if(sprites.length != 0) setDistribution(finalDistribution)
    setHiddenCentralCategories(hiddenCentralCategories)
  }, [chosen, product, characters, background])

  useEffect(() => {
    // setInterval(() => {
    //   const el = document.getElementById("canvas")
    //   el.style.height = '500px'
    //   el.style.width = '500px'
    // }, 1000)

  }, [])

  useEffect(() => {
    const fonts = new Set(Array.from(document.fonts).map(x => x.family))
    setFontLoaded(fonts.has(title));

    document.fonts.onloadingdone = e => {
      console.log("fontSet>>", new Set([...e.fontfaces].map(x => x.family)))
      setFontLoaded(fonts.has(title));
   }
  

   const getImgHeight = (url, scale, cb) => {
    var img = new Image();
    img.style.scale = scale

    const foundCategory = ogProduct?.categories?.find(
      cat => 
        cat?.subcategories?.map(sc => sc?.characters).flat().includes(url) || 
        cat?.subcategories?.map(sc => sc?.characters).flat().includes(encodeURIComponent(url)) ||
        cat?.subcategories?.map(sc => sc?.characters).flat().includes(makeSpriteModification(url))
    )
    const foundSubcategory = foundCategory?.subcategories?.find(
      sub => sub?.characters?.includes(url) || 
        sub?.characters?.includes(encodeURIComponent(url)) ||
        sub?.characters?.includes(makeSpriteModification(url))
    )
    const distSprite = distribution.find(dist => foundSubcategory?.characters?.includes?.(dist.sprite))

    function getHeight(length, ratio) {
      var height = ((length)/(Math.sqrt((Math.pow(ratio, 2)+1))));
      return Math.round(height);
    }

    function getWidth(length, ratio) {
      var width = ((length)/(Math.sqrt((1)/(Math.pow(ratio, 2)+1))));
      return Math.round(width);
    }

    img.onload = () => {
      const height = img.height;
      const width = img.width;
      cb({
        height: distSprite ? 
          document.getElementsByClassName(distSprite.sprite)?.[0]?.getBoundingClientRect()?.height : 
          getHeight(height*scale, height/width),
        width: getWidth(height*scale, height/width)
      })
    }

    img.src = url
   }

   (async () => {
    const realOffsets = {}
    let i = 0
    for(const sprite of distribution) getImgHeight(
      sprite.sprite, 
      (sprite.scale == 0 ? 1 : sprite.scale/100)*(sprite.categoryScale == 0 ? 1 : sprite.categoryScale/100),
      obj => {
        realOffsets[sprite.sprite] = obj
        i++
        if(i == distribution.length) setRealOffsets(realOffsets)
      }
    )
   })()
  }, [title, subtitle, product, characters, background, distribution])

  const setCartData = () => {
    const cartObj = getKey("cart") ?? []
    const productData = {
      selections: {
        product: { ...product, templeteArray: undefined }, 
        distribution,
        ...Object.fromEntries(Object.entries(selectedPricingOptions).map(([k, obj]) => [`pricing-${k}`, obj.name])),
        ...Object.fromEntries(Object.entries(selectedPricingOptions).map(([k, obj]) => [k, obj.name])),
        background,
        title,
        subtitle,
        characters,
        realOffsets,
        // templeteArray,
        offsets,
        rects: Object.fromEntries(Object.keys(offsets).map(x => [x, JSON.parse(JSON.stringify(document.querySelector(`[src="${x}"]`)?.getBoundingClientRect() ?? "{}"))]))
      }
    }
    console.log("MXC", offsets, productData.selections)
    cartObj.push(productData)
    setKey("cart", cartObj)
  }

  return (
    <div className="cactus-dashboard-main_container">
      {recents == 'no' ? <></> : <NavBar onProductClick={async (od, setLoading) => {
          console.log("Navigating through custom function")
          navigate(`/?productId=${od._id}`)
      }} />}
      {selectedImage && <NestedDescription img={selectedImage} setShowModalDes={setSelectedImage}/>}
      {showPaymentModel && (
        <PaymentModel
          autoSelect={autoSelect}
          additionalData={showPaymentModel}
          closeModal={() => setShowPaymentModel(null)}
          ogProduct={JSON.parse(decodeURIComponent(JSONProduct))}
          product={product}
          hasStaticPositions={hasStaticPositions(ogProduct)}
          onClick={(optionId, {rects}) => {
            const selectedCardPayment = optionId != 3
            const showBillingScreenForCard = optionId == 1
            const minorBilling = optionId == 2
            console.log("HERE, NAV  props", optionId, showBillingScreenForCard, selectedCardPayment)
            console.log("HERE, NAV")
            setWithCard(selectedCardPayment)
            setShowPaymentModel(null)
            const selectionObject = {
              product: {
                ...product, 
                price: Object.entries(selectedPricingOptions).map(([_, obj]) => parseFloat(obj.price ?? '0')).reduce((a, b) => a+b, 0), 
                templeteArray: undefined
              }, 
              distribution,
              ...Object.fromEntries(Object.entries(selectedPricingOptions).map(([k, obj]) => [k, obj.name])),
              background,
              title,
              subtitle,
              characters,
              realOffsets,
              showBillingScreenForCard,
              withCard: selectedCardPayment,
              minorBilling,
              // templeteArray,
              offsets,
              rects,
            }
            navigate(`/billingAddress?${setParam({ product: product._id })}`, {
              state: { 
                selections: selectionObject
              }
            })
            // }, 1500)
          }}
        />
      )}
      {defaultModel && (
        <DefaultModel
          autoSelect={autoSelect}
          ogProduct={JSON.parse(decodeURIComponent(JSONProduct))}
          product={product}
          hasStaticPositions={hasStaticPositions(ogProduct)}
          onClick={product => {
            console.log("chs2", firstLoad)
            firstLoad = false
            setProduct(Object.freeze(product))
            setChosen(true)
            setAutoSelect(false)
            setDefaultModel(false)
          }}
        />
      )}
      {familyCompositionModel && (
        <CompositionModel onClick={() => setFamilyCompositionModel(false)} />
      )}
      {chooseBackgroundModel && (
        <ChooseBackgroundModel
          backgrounds={product.backgrounds.filter(x => !x.coordinateVariation.evenFor)}
          onClick={data => {
            if(data.image) setBackground(data.image)
            setChooseBackgroundModel(undefined)
          }}
        />
      )}
      {chooseGenderModel && (
        <GenderModel isPhone={isPhone()} index={chooseGenderModel.index} variation={chooseGenderModel.array} femaleVariations={chooseGenderModel.femaleArray} onClick={(data) => {
          if(data.type) return setChooseGenderModel(undefined)
          if(!data.image) data.image = undefined
          console.log("EMPTY >>>>>", chooseGenderModel)
          // const [cat, scat] = getCategoryOfCharacter(product, data.image)
          // setCharacterCategoryObject({ ...characterCategoryObject, [cat.categoryName]: [...(characterCategoryObject[cat] ?? []), data.image] })
          setCharacters(characters.map((ch, i) => i == chooseGenderModel.totalIndex ? data.image : ch))
          setChooseGenderModel(undefined)
        }} />
      )}

      <div className="cactus-dashboard-container">
        <div className="cactus-templet_detail_top_container">
          <div className="cactus-templete_detail_side_templetes_view">
            <img
              src={arrowBack}
              className="cactus-templete_detail_side__view_arrow_up"
              onClick={() => document.getElementById("cactus-list").scrollLeft -= 100}
            />
            <div id="cactus-list" className="cactus-list">
              {sideTempleArray.filter(item => item?.image?.coordinateVariation?.preview || item?.image?.url).map((item) => {
                return (
                  item.image.url ?
                    <img
                      key={item.id}
                      src={item?.image?.coordinateVariation?.preview || item?.image?.url}
                      // onClick={() => setBackground(item.image)}
                      style={{ cursor: 'pointer', width: !ratios.has(item.image.url) ? '9rem' : undefined, height: !ratios.has(item.image.url) ? '9rem' : undefined}}
                      className="cactus-templete_detail_side__view_image_style"
                      onClick={() => setSelectedImage(item?.image?.coordinateVariation?.preview || item?.image?.url)}
                    /> :
                  <h3>Sélectionnez une image</h3>
                );
              })}
            </div>
            <img
              src={arrowBack}
              className="cactus-templete_detail_side__view_arrow_down"
              onClick={() => document.getElementById("cactus-list").scrollLeft += 100}
            />
          </div>
          <div className="cactus-templete_detail-main_image_view">
            <div className="cactus-templete_detail-main_image_button_view">
              <h5>{product.mainDesc}</h5>
            </div>
            <div style={JSON.parse(JSON.stringify({ height: '500px', width: isPhone() ? '350px' : '500px', position: "relative", margin: 0, padding: 0 }))} className="cactus-templete_detail-main_image">
              <canvas id="canvas" height={"500px"} width={isPhone() ? '350px' : '500px'} style={{ backgroundImage: `url("${background?.coordinateVariation?.alternate ?? background.url}")`, width: '100%', height: '100%', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }}></canvas>
              {defaultModel || showPaymentModel || selectedImage || chooseBackgroundModel || chooseGenderModel || !background.coordinateVariation.frame ? <></> : <img src={background.coordinateVariation.frame} style={{
                zIndex: 100000000000000,
                position: "absolute", 
                top: -1,
                left: parseInt(background.coordinateVariation.fameScale) + 1 == 361 ? -3 : -1,
                height: "101%",
                maxWidth: "500px",
                width: background.coordinateVariation.fameScale == undefined ? "200px" : `${parseInt(background.coordinateVariation.fameScale) + 1}px`,
              }}/>}
              {console.log("OFSET>", offsets, groupDistribution(ogProduct, distribution), product?.offsets)}
              {groupDistribution(ogProduct, distribution).map(sprites => <>
                {
                  (defaultModel || showPaymentModel || chooseBackgroundModel || chooseGenderModel) ? [] : sprites.map(sprite => <img data-categoryLayer={sprite?.categoryLayer} data-truth={sprite.y - (sprite.offset - sprite.rectHeight)/2} className={sprite.sprite} src={sprite.hidden ? "" : sprite.sprite} style={{
                    height: "unset", 
                    width: "unset", 
                    position: "absolute", 
                    _: console.log("GVN", sprite.categoryName, sprite, sprite.fixedWidth, sprite.x),
                    _: console.log("do we", product.alignBottom, "so now", decodeURIComponent(sprite.sprite), "at", sprite.y, "XTSCALE", sprite.rectHeight, sprite.offset, "offset-height", sprite.offset / 2, "rect-height", sprite.rectHeight / 2),
                    _: console.log("STATS", (sprite.scale == 0 ? 1 : sprite.scale/100), (sprite.categoryScale == 0 || sprite.categoryScale == "" ? 1 : sprite.categoryScale/100), (sprite.scale == 0 ? 1 : sprite.scale/100)*(sprite.categoryScale == 0 ? 1 : sprite.categoryScale/100), realOffsets[sprite.sprite]?.width, sprite),
                    left: `${((parseFloat(sprite.x) + parseInt(product.xAddition ?? "0") + parseFloat(sprite.fixedWidth == "" || sprite.fixedWidth == undefined ? "0" : sprite.fixedWidth)) - ((product.alignCenterX ? (sprite.offsetWidth == sprite.rectWidth && sprite.ogSubcategoryName == sprite.subcategoryName ? 0 : (sprite.offsetWidth - sprite.rectWidth)/2) : 0)))}px`, 
                    top: `${((parseFloat(sprite.y) + parseInt(product.yAddition ?? "0") + parseFloat(sprite.fixedOffset == "" || sprite.fixedOffset == undefined ? "0" : sprite.fixedOffset)) - ((product.alignBottom ? ((sprite.offset ?? 0)) - (sprite.rectHeight ?? 0) : (product.alignCenter ? (sprite.offset == sprite.rectHeight && sprite.ogSubcategoryName == sprite.subcategoryName ? 0 : ((realOffsets[sprite.sprite]?.height ?? 1) - (sprite.rectHeight ?? 0))/2) : 0))))}px`,
                    scale: `${(sprite.scale == 0 ? 1 : sprite.scale/100)*(sprite.categoryScale == 0 ? 1 : sprite.categoryScale/100)*(product.scaleAddition == 0 || !product.scaleAddition ? 1 : product.scaleAddition/100)}`,
                    maxWidth: "500px",
                    transformOrigin: "0 0",
                    zIndex: 100*(sprite.layer+1)+((sprite?.categoryLayer ?? 0)*1000)
                  }}/>)
                }
              </>)}
              {console.log("LOGO COMP", ratios.has(background.url))}
              {(defaultModel || showPaymentModel || chooseBackgroundModel || chooseGenderModel || selectedImage) ? <></> : <img className="overlay-logo-template" src={logo} style={ratios.has(background.url) ? {} : {
                top: "74px",
                left: "100px"
              }}/>}
              {<div id="overlay-title-hidden" ref={overlayTitleHidden} style={{ position: "absolute", zIndex: -100000 }}>
                {<div style={{
                  // height: "500px", 
                  // width: "500px", 
                  whiteSpace: 'nowrap',
                  position: "absolute", 
                  left: `${background.coordinateVariation.xText}px`, 
                  top: `${background.coordinateVariation.yText}px`,
                  fontSize: `${background.coordinateVariation.textSize}pt`,
                  fontFamily: background.font,
                  color: background.coordinateVariation.color,
                }}>{title}</div>}
              </div>}
              {<div id="overlay-subtitle-hidden" ref={overlaySubtitleHidden} style={{ position: "absolute", zIndex: -100000 }}>
                {<div style={{
                  // height: "500px", 
                  // width: "500px", 
                  whiteSpace: 'nowrap',
                  position: "absolute", 
                  left: `${background.coordinateVariation.xSmallText}px`, 
                  top: `${background.coordinateVariation.ySmallText}px`,
                  fontSize: `${background.coordinateVariation.smallTextSize}pt`,
                  fontFamily: background.smallFont,
                  color: background.coordinateVariation.smallColor,
                }}>{subtitle}</div>}
              </div>}
              {defaultModel || showPaymentModel || chooseBackgroundModel || chooseGenderModel || selectedImage ? <></> : <MultiText background={background}/>}
            </div>
            <div className="cactus-templete_poster-desc" style={{
              // width: ratios.has(background.url) ? "350px" : "500px",
              width: "500px",
            }}>
              <p>{product.posterDesc}</p>
            </div>
          </div>
          <div className="cactus-templete_detail-detail_top_view">
            <h1>{title}</h1>
            <h2>{product.desc}</h2>
            {console.log("PRCNGOPT", selectedPricingOptions)}
            <h3>{(0 + parseFloat(Object.values(selectedPricingOptions).map(({price}) => parseFloat(price)).reduce((a, b) => a+b, 0))).toFixed(2)} €</h3>
            {Object.entries(pricingObject).map(([section, prices]) => <DropdownModel
              _={console.log("RELAPRICE", prices)}
              name={selectedPricingOptions[section]?.name}
              array={prices}
              dropdownValue={shownPricingOptions[section]}
              onClickValue={(data) => [
                setSelectedPricingOptions({ ...selectedPricingOptions, [section]: data }),
                setShownPricingOptions({ ...shownPricingOptions, [section]: false }),
              ]}
              onClick={() => setShownPricingOptions({ ...shownPricingOptions, [section]: !shownPricingOptions[section] })}
            />)}
            <div className="cactus-templete_detail-form_top_view">
              <div className="cactus-templete_detail-form_title">
                <h4>Personnalisez l'affiche</h4>
                {/* <h4>Personnalisez</h4>
                <h5>Composition de la famille</h5> */}
              </div>
              <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <button className='cactus-default-select-btn' style={{ color: 'whitesmoke', width: "350px", alignSelf: 'center', marginBottom: "10px", display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setDefaultModel(true)}>
                    <h3 style={{ color: "whitesmoke", padding: "0px", fontSize: "2rem" }}>Modifier le nombre de personnages</h3>
                </button>
              </div>
              <CustomInputWithDropdown
                type={"name"}
                value={"Modifier le nom"}
                modalOpened={defaultModel || showPaymentModel || chooseBackgroundModel || chooseGenderModel || selectedImage || errorModal}
                subtitle={subtitle}
                onChangeSubtitle={setSubtitle}
                title={title}
                onChangeTitle={setTitle}
                dropdownValue={showEditNameDropdown}
                onClickEditNameDropdown={() =>
                  setShowEditNameDropdown(!showEditNameDropdown)
                }
              />
              <CustomInputWithDropdown
                onClickButton={() => setChooseBackgroundModel(true)}
                type={"background"}
                value={"Modifier l'arrière-plan"}
                modalOpened={defaultModel || showPaymentModel || chooseBackgroundModel || chooseGenderModel || selectedImage || errorModal}
                dropdownValue={showEditBackgroundDropdown}
                dropdownData={{image: product.backgrounds[product.defaultBackground]}}
                onClickEditNameDropdown={() =>
                  setShowEditBackgroundDropdown(!showEditBackgroundDropdown)
                }
              />
              {
                accImageIndexes(hiddenCentralCategories, product.categories.map((cat, i) => [cat.name, getCharacters(cat).map((img, ind) => [img, ind])])).map(([name, images], ix) => images.map(([image, totalIndex], i) => (hiddenCentralCategories[`${name} ${i+1}`] && hasStaticPositions(product)) ? <></> : <CustomInputWithDropdown
                  containerStyle={{ display: product.categories.find(cat => cat.name == name)?.hidden ? "none" : undefined }}
                  onClickButton={() => setChooseGenderModel({_: console.log("PARENT-ARRANGEMENT", ), type: name, totalIndex, index: i, array: arrangeByParent(product.categories.find(cat => cat.name === name).subcategories.map((sub, id) => {
                    const giveni = findIndex(cat => cat.name == name,  product.categories)
                    const j = id
                    return {
                      id,
                      parent: sub.parent,
                      title: sub.name,
                      array: sub.characters.map((x, n) => { return { id: n+1, index: totalIndex, image: product.categories.find(cat => cat.name == name)?.hidden ? "" : x , i: giveni, j, k: n } }),
                      icon: sub.image,
                    }
                  }))})}
                  type={"adult"}
                  categoryName={name}
                  modalOpened={defaultModel || showPaymentModel || chooseBackgroundModel || chooseGenderModel || selectedImage}
                  value={`Modifier ${name} ${i+1}`}
                  dropdownValue={showEditAdultDropdown?.index === totalIndex && showEditAdultDropdown?.category == name}
                  dropdownData={{ image: characters[totalIndex] }}
                  onClickEditNameDropdown={() => {
                      setShowEditAdultDropdown(showEditAdultDropdown?.index === totalIndex && showEditAdultDropdown?.category == name ? undefined : {category: name, totalIndex, index: totalIndex})
                    }
                  }
                />))
              }
            </div>
            <div className="order-buttons" style={{ display: "flex" }}>
              <div
                onClick={async () => {
                  // const img = await screenshot(document.getElementsByClassName("cactus-templete_detail-main_image_view")[0])
                  // console.log("imgs=>", img)
                  setCartData()
                  setShowPaymentModel({ rects: Object.fromEntries(Object.keys(offsets).map(x => [x, JSON.parse(JSON.stringify(document.querySelector(`[src="${x}"]`)?.getBoundingClientRect() ?? "{}"))])) })
                }}
                style={{ marginRight: "1.5rem" }}
                className="cactus-templete_detail-order_button"
              >
                <h5>Commandez maintenant</h5>
              </div>
              <div className="cactus-templete_detail-order_button" onClick={() => {
                setCartData()
                setErrorModal("show")
                swal({
                  title: "Succès",
                  text: "Le produit a été ajouté à votre panier.",
                  icon: "success",
                  // dangerMode: true,
                }).then(_ => setErrorModal(null))
              }}>
                <h5>Ajouter au panier</h5>
            </div>
            </div>
          </div>
        </div>
        {/* <div style={{ display: recents == 'no' ? 'none' : 'undefined' }} className="cactus-templet_detail_bottom_view">
          <h1>Recently Viewed</h1>
          <div className="cactus-dashboard-templete_top_view">
            {templeteArray.slice(-4).map((item) => {
              return (
                <TempleteView
                  onClick={() => {
                    ogProduct = {...Object.freeze(item)}
                    setProduct({...Object.freeze(item)})
                      // navigate(`/templetedetail?${setParam({
                      //     product: JSON.stringify(item)
                      // })}`)
                    }
                  }
                  item={item}
                />
              );
            })}
          </div>
        </div> */}
        { recents == 'no' ? <></> : <Footer /> }
      </div>
    </div>
  );
}

export default function TempleteDetailWrapper() {
  const { product: JSONProductFromURL, recents } = getAllParams()
  const [JSONProduct, setJSONProduct] = useState(JSONProductFromURL)
  const [ogProduct, setOgProduct] = useState(Object.freeze(JSON.parse(JSONProductFromURL)))

  return <TempleteDetail ogProduct={ogProduct} setOgProduct={x => {
    console.log("naviX", x.mainDesc)
    setOgProduct(x)
    setJSONProduct(JSON.stringify(x))
  }} JSONProduct={JSONProduct} recents={recents}/>
}

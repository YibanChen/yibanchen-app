import Loader from "react-loader-spinner";

function YibanLoader(props) {
  return (
    <Loader
      className={`${props.styleName}`}
      type={props.type}
      color={props.color}
      height={props.size}
      width={props.size}
    />
  );
}

export default YibanLoader;

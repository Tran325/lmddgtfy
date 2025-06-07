pragma solidity >=0.5.0;
interface IWETH {
    function deposit() external payable;
    function withdraw(uint) external;
    function approve(address, uint) external returns(bool);
    function transfer(address, uint) external returns(bool);
    function transferFrom(address, address, uint) external returns(bool);
    function balanceOf(address) external view returns(uint);
}